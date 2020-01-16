Vue.use("vue-resource")
Vue.component('v-select', VueSelect.VueSelect);
Vue.use(VueLoading);
Vue.component('loading', VueLoading)

var app = new Vue({
    el: '#app',
    data: {
        api_host: "",
        matchid: 0,
        players: {},
        selectList: [],
        lineupReady: false,
        reddef: null,
        redfor: null,
        bluedef: null,
        bluefor: null,
        score: {'red': 0, 'blue': 0},
        ApiCallInProgress: false,
        Message: "",
        last_matches: [],
        goals: []
    },
    methods: {
        loadPlayersList: function () {
            this.$http.get(this.api_host + '/api/players').then(response => {
                this.selectList = []
                response.body.forEach(element => {
                    this.players[element.ID] = element.Name
                    this.selectList.push({"id": element.ID, "label": element.Name})
                    });
                }, response => {
                console.log("loadPlayersList: error")
            });
        },
        matchReady: function () {
            if (this.reddef === null || this.redfor === null || this.bluedef === null || this.bluefor === null) {
                return true
            } else {
                return false
            }
        },
        gotWinner: function () {
            if (this.score.red === 5 || this.score.blud === 5) {
                return false
            } else {
                return true
            }
        },
        startMatch: function () {
            this.ApiCallInProgress = true
            this.$http.post(this.api_host + '/api/match/start', {'lineup': [
                {'id': this.reddef.id, 'team': 'Red', 'position': 'Defender'},
                {'id': this.redfor.id, 'team': 'Red', 'position': 'Forward'},
                {'id': this.bluedef.id, 'team': 'Blue', 'position': 'Defender'},
                {'id': this.bluefor.id, 'team': 'Blue', 'position': 'Forward'},
            ]}).then(response => {
                if (response.body['err'] === 'nil') {
                    this.matchid = response.body['matchid']
                    this.ApiCallInProgress = false
                } else {
                    console.log(response.body['err'])
                    this.Message = response.body['err']
                }
            })
        },
        Score: function(position) {
            if ( ['reddef', 'redfor'].indexOf(position) >=0 ) {
                this.goals.push({"id": this[position].id, "auto": "false", "team": "red"})
                this.score["red"] += 1
            } else {
                this.goals.push({"id": this[position].id, "auto": "false", "team": "blue"})
                this.score["blue"] += 1
            }
        },
        Auto: function(position) {
            if ( ['reddef', 'redfor'].indexOf(position) >=0 ) {
                this.goals.push({"id": this[position].id, "auto": "true", "team": "blue"})
                this.score["blue"] += 1
            } else {
                this.goals.push({"id": this[position].id, "auto": "true", "team": "red"})
                this.score["red"] += 1
            }
        },
        CommitGoal: function(goal) {
            return fetch(this.api_host + '/api/match/score', {
                    method: 'POST',
                    redirect: 'follow',
                    body: JSON.stringify({'pid': goal.id, 'matchid': this.matchid, 'auto': goal.auto}),
                    headers: {
                        'Content-Type': 'application/json'
                      }
                }
            ).then(response => response.json());
        },
        RevertGoal: function() {
            if (this.goals.length > 0) {
                var last = this.goals.pop()
                this.score[last.team] -= 1
            }
        },
        SubmitMatch: function() {
            return fetch(this.api_host + '/api/match/end', {
                method: 'POST',
                redirect: 'follow',
                body: JSON.stringify({'matchid': this.matchid}),
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(response => response.json());
        },
        endMatch: async function () {
            this.ApiCallInProgress = true
            while(this.goals.length > 0) {
                const resp = await this.CommitGoal(this.goals[this.goals.length - 1])
                if (resp['err'] === 'nil') {
                    this.goals.pop()
                } else {
                    this.Message = response.body['err']
                }
            }
            const matchcommit = await this.SubmitMatch()
            this.ApiCallInProgress = false
            if ( 'Winner' in matchcommit) {
                this.matchid = 0
                this.reddef = null
                this.redfor = null
                this.bluedef =  null
                this.bluefor =  null
                this.Message = "last winner: " + matchcommit['Winner']
                this.score = {'red': 0, 'blue': 0}
            } else {
                this.Message = matchcommit['err']
            }
        },
        lastMatches: function() {
            this.$http.post(this.api_host + '/api/stats/matchresults', {'num': 5})
            .then(response => {
                response.body.result.forEach(element => {
                    mr = {"red": {"score": element.Red}, "blue": {"score": element.Blue}}
                    element.Lineup.forEach(pos => {
                        if (pos.team === "Red") {
                            mr.red[pos.position] = pos.id
                        } else {
                            mr.blue[pos.position] = pos.id
                        }
                    })
                    this.last_matches.push(mr)
                })
            })
        }
    },
    mounted: function() {
        this.$nextTick(function () {
            app.loadPlayersList()
            app.lastMatches()
        })
    }
})
