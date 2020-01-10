Vue.use("vue-resource")
Vue.component('v-select', VueSelect.VueSelect);
Vue.use(VueLoading);
Vue.component('loading', VueLoading)

var app = new Vue({
    el: '#app',
    data: {
        api_host: "",
        players: {},
        ApiCallInProgress: false,
        Message: "",
        ratings_goals: {},
	ratings_goals_avg: {},
        overall: {},
        ratings_winrate: {},
        matches: []
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
        loadGoalsRatings: function () {
            this.$http.post(this.api_host + '/api/stats/ratings/goals').then(response => {
                this.ratings_goals = response.body.result
		let avg_unordered = {}
		this.ratings_goals.forEach(elem => {
		    avg_unordered[elem.Total / elem.Games] = elem.Id
		});
		Object.keys(avg_unordered).sort().reverse().forEach(function(key) {
		    app.ratings_goals_avg[key] = avg_unordered[key];
		});
            });
        },
        loadOverall: function () {
            this.$http.get(this.api_host + '/api/stats/overall').then(response => {
                this.overall = response.body
            });
        },
        loadWinrate: function () {
            this.$http.get(this.api_host + '/api/stats/winrate').then(response => {
                this.ratings_winrate = response.body
            });
        },
        loadMatches: function () {
            this.$http.post(this.api_host + '/api/stats/matchresults', {'num': 10})
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
                    mr['goals'] = element.Goals
                    this.matches.push(mr)
                })
            })
        },
    },
    mounted: function() {
        this.$nextTick(function () {
            app.loadPlayersList()
            app.loadGoalsRatings()
            app.loadOverall()
            app.loadWinrate()
            app.loadMatches()
        })
    }
})
