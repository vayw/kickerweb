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
        temp_score_team: null,
        ApiCallInProgress: false,
        Message: "",
        last_matches: []
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
            this.ApiCallInProgress = true
            if ( ['reddef', 'redfor'].indexOf(position) >=0 ) {
                this.temp_score_team = 'red'
            } else {
                this.temp_score_team = 'blue'
            }
            this.$http.post(this.api_host + '/api/match/score', {'pid': this[position]["id"], 'matchid': this.matchid})
            .then(response => {
                this.ApiCallInProgress = false
                if (response.body['err'] === 'nil') {
                    this.score[this.temp_score_team] += 1
                } else {
                    this.Message = response.body['err']
                }
            })
        },
        endMatch: function () {
            this.ApiCallInProgress = true
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
            this.$http.post(this.api_host + '/api/stats/matchresults', {'num': 3})
            .then(response => {
                response.body.forEach(element => {
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
})

app.loadPlayersList()
app.lastMatches()
