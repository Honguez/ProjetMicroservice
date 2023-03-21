const Seneca = require('seneca')

const {uuid} = require('uuidv4');
const seneca = Seneca({log: 'silent'})

function crud_wr() {

    let wr_list = {};

    //enregistrement des routes pour le CRUD
    this.add('role:wr, cmd:create, applicant:*, work:*, dc_date:* ', create_wr)
    this.add('role:wr, cmd:read', readAll_wr)
    this.add('role:wr, cmd:read, id:*', read_wr)
    this.add('role:wr, cmd:update, id:* ,work:*, compl_date:*', update_wr)
    this.add('role:wr, cmd:update, id:* , compl_date:*', update_wr)
    this.add('role:wr, cmd:update, id:* ,work:*', update_wr)
    this.add('role:wr, cmd:delete, id:*', delete_wr)

    function create_wr(msg, callback) {
        const applicant = msg.applicant;
        const work = msg.work;
        const dc_date = msg.dc_date;

        // Vérification que tous les champs nécessaires sont présents
        if (!applicant || !work || !dc_date) {
            callback(null, {success: false, message: 'Les champs applicant, work et dc_date sont requis'});
        }

        // Génération d'un ID unique pour la nouvelle demande de travail
        const id = uuid();

        // Ajout de la nouvelle demande de travail à la liste
        const new_wr = {
            id: id,
            applicant: applicant,
            work: work,
            state: 'created',
            dc_date: dc_date,
            compl_date: ''
        };

        wr_list[id] = new_wr

        // Renvoie de l'ID de la nouvelle demande de travail dans le callback
        callback(null, {success: true, data: new_wr});
    }

    function read_wr(msg, callback) {

        let wr = wr_list[msg.id]
        if (wr) {
            // Si la demande de travail existe, on la renvoie
            callback(null, {success: true, data: wr});
        } else {
            // Sinon, on renvoie une erreur
            callback(null, {
                success: false,
                message: "L'ID de la demande de travail passé en paramètre n'existe pas"
            });
        }
    }


    function readAll_wr(msg, callback) {
        let wrs = Object.values(wr_list)
        callback(null, {success: true, data: wrs});
    }

    function update_wr(msg, callback) {
        const wr_id = msg.id;
        const work = msg.work;
        const compl_date = msg.compl_date;

        if (!wr_id) {
            return callback(null, {
                success: false,
                message: "L'ID de la demande de travail est requis pour mettre à jour une demande de travail"
            });
        }

        let wr = wr_list[wr_id];

        if (!wr) {
            return callback(null, {
                success: false,
                message: "L'ID de la demande de travail passé en paramètre n'existe pas"
            });
        }

        if (wr.state !== 'created') {
            return callback(null, {
                success: false,
                message: "Impossible de modifier une demande de travail qui est terminée"
            });
        }

        if (work) {
            wr.work = work;
        }

        if (compl_date) {
            wr.compl_date = compl_date;
            wr.state = "closed"
        }

        wr_list[wr_id] = wr;

        return callback(null, {
            success: true,
            data: wr
        });
    }


    function delete_wr(msg, callback) {

        const wr_id = msg.id;

        if (!wr_id) {
            return callback(null, {
                success: false,
                message: "L'ID de la demande de travail est requis pour la suppression"
            });
        }

        let wr = wr_list[wr_id];

        if (!wr) {
            return callback(null, {
                success: false,
                message: "L'ID de la demande de travail passé en paramètre n'existe pas"
            });
        }

        if (wr.state === 'closed') {
            return callback(null, {
                success: false,
                message: "Impossible de supprimer une demande de travail dont le statut est 'closed'"
            });
        }

        delete wr_list[wr_id];

        return callback(null, {
            success: true,
        });
    }
}

//enregistrement du microservice
seneca.use(crud_wr)

//definition du port d'écoute

seneca.listen({port: 9000})