Vue.use("vue-resource")
Vue.component('v-select', VueSelect.VueSelect);

var app = new Vue({
    el: '#app',
    data: {
        api_host: "http://kicker.jzzy.ru",
        matchid: 0,
        players: {},
        selectList: [],
        lineupReady: false,
        reddef: "",
        redfor: "",
        bluedef: "",
        bluefor: "",
    },
    methods: {
        loadPlayersList: function () {
            this.$http.get(this.api_host + '/api/players').then(response => {
                this.selectList = []
                response.body.forEach(element => {
                    this.players[element.Name] = element.ID
                    this.selectList = Object.keys(this.players)
                    });
                }, response => {
                console.log("loadPlayersList: error")
            });
        },
        checkP: function (opt) {
            if (opt === this.redfor) {
                return false;
            } else {
                return true;
            }
        },
    }
})

app.loadPlayersList()