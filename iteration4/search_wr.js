const Seneca = require('seneca')
const seneca = Seneca()

function search_wr(){

    this.add('role:search, cmd:searchSimilar, search_parameter:*, wr_list:*, id:*', searchSimilar)

    function searchSimilar(msg, callback){

        const list_wr = msg.wr_list
        //si le message contient un id non null, on retourne une erreur
        if(msg.id){
            return callback(null, {
                success: false,
                msg: "query not possible with wr_id"
            });
        }

        let search_result = []
        const search_parameter = msg.search_parameter.search
        //si le mot clef dans les paramètres du message HTTP n'est pas search, on renvoie une erreur
        if(!search_parameter){
            return callback(null, {
                success: false,
                msg: "query parameter invalid"
            });
        }
        //sinon on boucle sur l'ensemble des wr que l'on a reçu dans wr_list
        for (let i=0; i<list_wr.length; i++){

            const applicant = list_wr[i].applicant
            const state = list_wr[i].state
            const work = list_wr[i].work

            if(applicant.includes(search_parameter)){
                search_result.push(list_wr[i])
            }
            else if(state.includes(search_parameter)){
                search_result.push(list_wr[i])
            }else if(work.includes(search_parameter)){
                search_result.push(list_wr[i])
            }
        }
        return callback(null, {success: true, data: search_result});
    }
}

seneca.use(search_wr)

seneca.listen({
    port: 12000
})