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
        overall: {},
        ratings_winrate: {},
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
                this.ratings_goals = response.body
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
    },
    mounted: function() {
        this.$nextTick(function () {
            app.loadPlayersList()
            app.loadGoalsRatings()
            app.loadOverall()
            app.loadWinrate()
        })
    }
})
