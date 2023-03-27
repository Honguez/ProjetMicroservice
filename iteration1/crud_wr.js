const Seneca = require('seneca')

const {uuid} = require('uuidv4');
const seneca = Seneca({log: 'silent'})

function currentDate() {
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0');
    let yyyy = today.getFullYear();

    today = mm + '/' + dd + '/' + yyyy;
    return today.toString();
}
function crud_wr() {

    let wr_list = {};

    //enregistrement des routes pour le CRUD
    this.add('role:wr, cmd:create, applicant:*, work:*, dc_date:* ', create_wr)
    this.add('role:wr, cmd:read', readAll_wr)
    this.add('role:wr, cmd:read, id:*', read_wr)
    this.add('role:wr, cmd:update, id:* ,work:*, state:*', update_wr)
    this.add('role:wr, cmd:update, id:* , state:*', update_wr)
    this.add('role:wr, cmd:update, id:* ,work:*', update_wr)
    this.add('role:wr, cmd:delete, id:*', delete_wr)
    this.add('role:wr, cmd:delete', deleteAll_wr)

    function create_wr(msg, callback) {
        const applicant = msg.applicant;
        const work = msg.work;
        const dc_date = msg.dc_date;

        // Vérification que tous les champs nécessaires sont présents
        if (!applicant || !work || !dc_date) {
            callback(null, {success: false, msg: 'Les champs applicant, work et dc_date sont requis'});
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
        };

        wr_list[id] = new_wr

        // Renvoie de l'ID de la nouvelle demande de travail dans le callback
        callback(null, {success: true, data: [new_wr]});
    }

    function read_wr(msg, callback) {
        let wr = wr_list[msg.id]
        if (wr) {
            // Si la demande de travail existe, on la renvoie
            callback(null, {success: true, data: [wr]});
        } else {
            // Sinon, on renvoie une erreur
            callback(null, {
                success: false,
                msg: "wr not found"
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
        const state = msg.state;

        //si l'id est vide, on renvoie une erreur
        if (!wr_id) {
            return callback(null, {
                success: false,
                msg: "wr id not provided"
            });
        }

        //ensuite on vérifie si le wr existe dans la liste
        let wr = wr_list[wr_id];
        // si il n'existe pas, on renvoie une erreur
        if (!wr) {
            return callback(null, {
                success: false,
                msg: "wr not found"
            });
        }
        //puis on vérifie l'état de wr. Si il n'est pas a closed, on renvoie une erreur
        if (wr.state !== 'created') {
            return callback(null, {
                success: false,
                msg: "wr is already closed"
            });
        }

        //Sinon, on fait les modifications selon les valeurs qui ont été passés en param, tout en vérifiance qu'elles ne sont pas vides.
        if (work) {
            wr.work = work;
        }

        if (state) {
            wr.state = state;
            wr.compl_date = currentDate()
        }

        wr_list[wr_id] = wr;

        return callback(null, {
            success: true,
            data: [wr]
        });
    }


    function delete_wr(msg, callback) {

        const wr_id = msg.id;
        //si l'id est spécifié dans le chemin mais que la valeur est vide, on renvoie une erreur
        if (!wr_id) {
            return callback(null, {
                success: false,
                msg: "L'ID de la demande de travail est requis pour la suppression"
            });
        }
        //ensuite on vérifie si le wr existe dans la liste
        let wr_to_delete = wr_list[wr_id];
        // si il n'existe pas, on renvoie une erreur
        if (!wr_to_delete) {
            return callback(null, {
                success: false,
                msg: "wr not found"
            });
        }
        //puis on vérifie l'état de wr. Si il est a closed, on renvoie une erreur
        if (wr_to_delete.state === 'closed') {
            return callback(null, {
                success: false,
                msg: "wr is already closed"
            });
        }
        //sinon, on supprime le wr

        delete wr_list[wr_id];

        return callback(null, {
            success: true,
            data: [wr_to_delete]
        });
    }

    function deleteAll_wr (msg, callback){
        // Si aucun ID n'est spécifié, on appelle deleteALl_wr pour supprimer toutes les demandes de travail non fermées
        for (const id in wr_list) {
            const wr = wr_list[id];
            if (wr.state !== 'closed') {
                delete wr_list[id];
            }
        }
        return callback(null, {
            success: true,
        });
    }
}


//enregistrement du microservice
seneca.use(crud_wr)

//definition du port d'écoute

seneca.listen({port: 9000})