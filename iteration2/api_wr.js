const Seneca = require('seneca')
const SenecaWeb = require('seneca-web')
const Express = require('express')
const seneca = Seneca()
const BodyParser = require('body-parser')

let Routes = {
    prefix: '/api',
    // traite le premier préfixe '/api'
    pin: 'role:api',
    map: {
        'wr/:id_wr': {
            GET: true,
            PUT: true,
            DELETE: true
        },

        wr: {
            // méthodes HTTP autorisées
            PUT: true,
            GET: {suffix: '/:id'},
            DELETE: {suffix: '/:id'},
            POST: true,
        }
    }
}

function api_wr(options) {

    // traitement des messages Seneca de type { role , path }
    this.add('role:api', (msg, respond) => {
        let data = msg.args.body;     // accès aux données présentes dans la requête HTTP
        let url = msg.request$.url
        let id = msg.request$.url.substring(url.lastIndexOf('/') + 1)
        if(id == "wr"){
            id = ""
        }

        console.log("======================REQUETE===================")
        console.log("URL:" + url)
        console.log("Type:" + msg.request$.method)
        console.log("Body:" + msg.args.body)
        console.log("Params:" + msg.args.params.id)
        console.log("Arguments:" + msg.args.toString())
        console.log("ID: " + id)
        console.log("==============================================")

        switch (msg.request$.method) {
            case "GET":
                if (!id) {
                    this.act('role:wr', {
                        cmd: "read", // HTTP method
                    }, respond)
                } else {
                    this.act('role:wr', {
                        cmd: "read", // HTTP method
                        id: id
                    }, respond)
                }
                break
            case "POST":
                applicant = data.applicant
                work = data.work
                dc_date = data.dc_date
                if(!applicant){
                    applicant = ""
                }
                if(!work){
                    work = ""
                }
                if (!dc_date){
                    dc_date=""
                }
                this.act('role:wr', {
                    cmd: "create", // HTTP method
                    applicant: applicant,
                    work: work,
                    dc_date: dc_date,
                }, respond)
                break
            case "PUT":
                console.log("JE SUIS DANS LE PUT")

                work =  data.work
                state =  data.state
                console.log("Work: " + work)
                console.log("State: " + state)
                if(!work && !state){
                    work = ""
                }
                this.act('role:wr', {
                    cmd: "update", // HTTP method
                    id: id,
                    work: work,
                    state: state
                }, respond)

                break
            case "DELETE":
                console.log("JE SUIS DANS LE DELETE")
                if(id){
                    this.act('role:wr', {
                        cmd: "delete", // HTTP method
                        id: id
                    }, respond)
                }else {
                    this.act('role:wr', {
                        cmd: "delete", // HTTP method
                    }, respond)
                }

        }
    })

    // action déclenchée au démarrage de l’application permettant la transformation
    // des requêtes HTTP en messages Seneca
    this.add('init:api', (msg, respond) => {
        this.act('role:web', {
                routes: Routes
            }
            , respond)
    })
}

seneca.use(api_wr)

seneca.use(SenecaWeb, {
    options: {parseBody: false}, // desactive l'analyseur JSON de Seneca
    routes: Routes,
    context: Express().use(BodyParser.json()),     // utilise le parser d'Express pour lire les donnees
    adapter: require('seneca-web-adapter-express') // des requetes PUT
})

seneca.client({      // ce module enverra les message de api_wr
    port: 9000,      // sur le port 9000 (qui est le port sur lequel le microservice écoute)
})

seneca.ready(() => {
    const app = seneca.export('web/context')()
    app.listen(3000)
})