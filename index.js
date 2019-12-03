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
        reddef: null,
        redfor: null,
        bluedef: null,
        bluefor: null,
        score: {red: 0, blue: 0},
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
        matchReady: function () {
            if (this.reddef === null || this.redfor === null || this.bluedef === null || this.bluefor === null) {
                return true
            } else {
                return false
            }
        },
        startMatch: function () {
            this.$http.post(this.api_host + '/api/match/start', {'lineup': [
                {'id': this.players[this.reddef], 'team': 'Red', 'position': 'Defender'},
                {'id': this.players[this.redfor], 'team': 'Red', 'position': 'Forward'},
                {'id': this.players[this.bluedef], 'team': 'Blue', 'position': 'Defender'},
                {'id': this.players[this.bluefor], 'team': 'Blue', 'position': 'Forward'},
            ]}).then(response => {
                if (response.body['err'] === 'nil') {
                    this.matchid = response.body['matchid']
                }
            })
        }
    },
})

app.loadPlayersList()