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
        ratings_goals: {}
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
    }   
})

app.loadPlayersList()
app.loadGoalsRatings()
