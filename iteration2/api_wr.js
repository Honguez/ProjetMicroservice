const Seneca = require('seneca')
const SenecaWeb = require('seneca-web')
const Express = require('express')
const seneca = Seneca()
const BodyParser = require('body-parser')

let Routes = {
    prefix: '/api/',
    // traite le premier préfixe '/api'
    pin: 'role:api, target:*',
    map: {

        'wr/stats':{
            GET: true
        },
        'wr/stats/:applicant?':{
            GET: true
        },

        wr: {
            POST: true,
            GET: true,
            PUT: true,
            DELETE: true

        },
        'wr/:id?': {
            POST: true,
            GET: true,
            PUT: true,
            DELETE: true
        }
    }
}

function api_wr(options) {

    this.add('role:api,target:wr/stats*', (msg, callback) => {

        let url = msg.request$.url
        let applicant = msg.request$.url.substring(url.lastIndexOf('/') + 1)

        if (!applicant || applicant == "stats") {
            this.act('role:stats', {
                scope:'global',
                cmd: "getStats",
            }, callback)
        } else {
            this.act('role:stats', {
                scope:'user',
                cmd: "getStats",
                applicant:applicant
            }, callback)
        }

    })

    // traitement des messages Seneca de type { role , path }
    this.add('role:api,target:wr*', (msg, callback) => {
        let data = msg.args.body;     // accès aux données présentes dans la requête HTTP
        let search = msg.args.query
        let url = msg.request$.url
        let id = msg.request$.url.substring(url.lastIndexOf('/') + 1)
        //On vérifie que l'id soit bien ce que l'on souhaite (si pas de /{id} après api/wr, id vaut wr dans notre cas)
        if(id.includes( "wr")){
            id = ""
        }
        //Switch case sur la méthode du message reçu pour utiliser la bonne route
        switch (msg.request$.method) {

            case "GET":
                //On vérifie que l'id existe et qu'il n'y ait pas de paramètre
                // pour faire appel au microservice crud_wr et ça sa méthode read_wr
                if (id && !id.includes("?")) {
                    this.act('role:wr', {
                        cmd: "read", // HTTP method
                        id: id
                    }, callback)
                //On vérifie que la requête possède des paramètres, si on oui fera appel au microservice search_wr
                }else if(Object.keys(search).length > 0){
                    //On récupère l'ensemble des wr existant via le microservice crud_wr et sa méthode readAll_wr
                    // pour alimenter wr_list avant d'envoyer le message au microservice search_wr
                    this.act('role:wr', {
                        cmd: "read",
                    }, function(err, result){
                        this.act('role:search', {
                            cmd:'searchSimilar',
                            id:id,
                            search_parameter:search,
                            wr_list:result.data
                        }, callback)
                    })
                //Sinon on fait appel au microservice crud_wr et sa méthode readAll_wr
                } else {
                    this.act('role:wr', {
                        cmd: "read",
                    }, callback)
                }
                break

            case "POST":
                applicant = data.applicant
                work = data.work
                dc_date = data.dc_date
                //Si work ou applicant ou dc_date sont vides, le message n'est pas envoyé au microservice_crud
                // et nous n'obtenons pas le message d'erreur souhaité
                //On assigne leur kairs une chaine de charactère vide pour que le message puisse être transmis
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
                }, callback)
                break

            case "PUT":
                work =  data.work
                state =  data.state
                //Si le work et le state sont vides, le message n'est pas envoyé au microservice_crud
                // et nous n'obtenons pas le message d'erreur souhaité
                //On assigne alors a work une chaine de charactère vide pour que le message puisse être transmis
                if(!work && !state){
                    work = ""
                }
                this.act('role:wr', {
                    cmd: "update", // HTTP method
                    id: id,
                    work: work,
                    state: state
                }, callback)
                break

            case "DELETE":
                if(id){
                    this.act('role:wr', {cmd: "delete",id: id}, callback)
                }else {
                    this.act('role:wr', {cmd: "delete"}, callback)
                }
        }
    })


    // action déclenchée au démarrage de l’application permettant la transformation
    // des requêtes HTTP en messages Seneca
    this.add('init:api', (msg, respond) => {
        this.act('role:web', {routes: Routes}, respond)
    })
}

seneca.use(api_wr)

seneca.use(SenecaWeb, {
    options: {parseBody: false}, // desactive l'analyseur JSON de Seneca
    routes: Routes,
    context: Express().use(BodyParser.json()),     // utilise le parser d'Express pour lire les donnees
    adapter: require('seneca-web-adapter-express') // des requetes PUT
})


seneca.client({
    pin:'role:stats',// ce module enverra les message avec le role stats
    port: 6000,      // sur le port 9000 (qui est le port sur lequel le microservice stats écoute)
})

seneca.client({
    pin:'role:wr',   // ce module enverra les message avec le role wr
    port: 9000,      // sur le port 9000 (qui est le port sur lequel le microservice dt écoute)
})

seneca.client({
    pin:'role:search',// ce module enverra les message avec le role search
    port: 12000,      // sur le port 12000 (qui est le port sur lequel le microservice search écoute)
})

seneca.ready(() => {
    const app = seneca.export('web/context')()
    app.listen(3000)
})