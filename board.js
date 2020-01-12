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
        ratings_goals_forwards: {},
        ratings_goals_avg_forwards: {},
        ratings_goals_defenders: {},
	    ratings_goals_avg_defenders: {},
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
            this.$http.post(this.api_host + '/api/stats/ratings/goals', {'position': ''}).then(response => {
                this.ratings_goals = response.body.result
                let avg_unordered = []
                this.ratings_goals.forEach(elem => {
                    avg_unordered.push([elem.Id, elem.Total / elem.Games, elem.Games])
                });
                app.ratings_goals_avg = avg_unordered.sort(function(a,b) {
                    return a[1] - b[1];
                }).reverse();
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
        loadGoalsRatingsForwards: function () {
            this.$http.post(this.api_host + '/api/stats/ratings/goals', {'position': 'Forward'}).then(response => {
                this.ratings_goals_forwards = response.body.result
                let avg_unordered = []
                this.ratings_goals_forwards.forEach(elem => {
                    avg_unordered.push([elem.Id, elem.Total / elem.Games, elem.Games])
                });
                app.ratings_goals_avg_forwards = avg_unordered.sort(function(a,b) {
                    return a[1] - b[1];
                }).reverse();
            });
        },
        loadGoalsRatingsDefenders: function () {
            this.$http.post(this.api_host + '/api/stats/ratings/goals', {'position': 'Defender'}).then(response => {
                this.ratings_goals_defenders = response.body.result
                let avg_unordered = []
                this.ratings_goals_defenders.forEach(elem => {
                    avg_unordered.push([elem.Id, elem.Total / elem.Games, elem.Games])
                });
                app.ratings_goals_avg_defenders = avg_unordered.sort(function(a,b) {
                    return a[1] - b[1];
                }).reverse();
            });
        },
    },
    mounted: function() {
        this.$nextTick(function () {
            app.loadPlayersList()
            app.loadGoalsRatings()
            app.loadOverall()
            app.loadWinrate()
            app.loadGoalsRatingsForwards()
            app.loadGoalsRatingsDefenders()
        })
    }
})
