Vue.use("vue-resource")
Vue.component('v-select', VueSelect.VueSelect);
Vue.use(VueLoading);
Vue.component('loading', VueLoading)
Vue.use('vue-cookies')

Vue.$cookies.config('4d')

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
            if (this.score.red === 5 || this.score.blue === 5) {
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
                    this.$cookies.set("matchid", this.matchid)
                    this.$cookies.set("reddef", this.reddef)
                    this.$cookies.set("redfor", this.redfor)
                    this.$cookies.set("bluedef", this.bluedef)
                    this.$cookies.set("bluefor", this.bluefor)
                    this.$cookies.set("active", true)
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
            this.$cookies.set("goals", {"goals": this.goals})
            this.$cookies.set("score", this.score)
        },
        Auto: function(position) {
            if ( ['reddef', 'redfor'].indexOf(position) >=0 ) {
                this.goals.push({"id": this[position].id, "auto": "true", "team": "blue"})
                this.score["blue"] += 1
            } else {
                this.goals.push({"id": this[position].id, "auto": "true", "team": "red"})
                this.score["red"] += 1
            }
            this.$cookies.set("goals", {"goals": this.goals})
            this.$cookies.set("score", this.score)
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
            this.$cookies.set("goals", {"goals": this.goals})
            this.$cookies.set("score", this.score)
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
                this.$cookies.set("active", false)
                this.lastMatches()
            } else {
                this.Message = matchcommit['err']
            }
        },
        lastMatches: function() {
            this.last_matches = []
            this.$http.post(this.api_host + '/api/stats/matchresults', {'num': 3})
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
        },
        loadMatchFromCookies: function() {
            if (this.$cookies.get("active") === "true") {
                this.matchid = Number(this.$cookies.get("matchid"))
                this.reddef = this.$cookies.get("reddef")
                this.redfor = this.$cookies.get("redfor")
                this.bluedef = this.$cookies.get("bluedef")
                this.bluefor = this.$cookies.get("bluefor")
                this.score = this.$cookies.get("score")
                this.goals = this.$cookies.get("goals")["goals"]
            }
        },
        clearMatch: function() {
            this.$cookies.set("active", false)
            this.matchid = 0
            this.reddef = null
            this.redfor = null
            this.bluedef = null
            this.bluefor = null
            this.score = {'red': 0, 'blue': 0}
            this.goals = []
        }
    },
    mounted: function() {
        this.$nextTick(function () {
            app.loadPlayersList()
            app.lastMatches()
            app.loadMatchFromCookies()
        })
    }
})
