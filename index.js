Vue.use("vue-resource")
Vue.component('v-select', VueSelect.VueSelect);
Vue.use(VueLoading);
Vue.component('loading', VueLoading)

var app = new Vue({
    el: '#app',
    data: {
        api_host: "http://10.11.12.6:8000",
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
                this.goals.push({"id": this[position].id, "auto": false, "team": "red"})
                this.score["red"] += 1
            } else {
                this.goals.push({"id": this[position].id, "auto": false, "team": "blue"})
                this.score["blue"] += 1
            }
        },
        Auto: function(position) {
            if ( ['reddef', 'redfor'].indexOf(position) >=0 ) {
                this.goals.push({"id": this[position].id, "auto": true, "team": "red"})
                this.score["blue"] += 1
            } else {
                this.goals.push({"id": this[position].id, "auto": true, "team": "blue"})
                this.score["red"] += 1
            }
        },
        CommitGoal: function(goal) {
            console.log(goal)
            const response = fetch(this.api_host + '/api/match/score', {
                    method: 'POST',
                    redirect: 'follow',
                    body: JSON.stringify({'pid': goal.id, 'matchid': this.matchid, 'auto': goal.auto}),
                    headers: {
                        'Content-Type': 'application/json'
                      }
                }
            )
            const answ = response.json()
            if (answ['err'] === 'nil') {
                return true
            } else {
                this.Message = response.body['err']
                return false
            }
        },
        RevertGoal: function() {
            var last = this.goals.pop()
            this.score[last.team] -= 1
        },
        endMatch: function () {
            //this.ApiCallInProgress = true
            while(this.goals.length > 0) {
                r = this.CommitGoal(this.goals[this.goals.length - 1])
                if (r) {
                    this.goals.pop()
                }
            }
            this.$http.post(this.api_host + '/api/match/end', {'matchid': this.matchid})
            .then(response => {
                this.ApiCallInProgress = false
                if ( 'Winner' in response.body) {
                    this.matchid = 0
                    this.reddef = null
                    this.redfor = null
                    this.bluedef =  null
                    this.bluefor =  null
                    this.Message = "last winner: " + response.body['Winner']
                    this.score = {'red': 0, 'blue': 0}
                } else {
                    this.Message = response.body['err']
                }
            })
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
