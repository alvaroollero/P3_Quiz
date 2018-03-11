const {models}=require("./model");
const {log,biglog,errorlog,colorize}=require("./out");
const Sequelize =  require('sequelize');

exports.helpCmd=rl=>{
  log("Comandos:");
  log("h|help - Muestra ayuda");
  log("list-Listar quizzes existentes");
  log("show <id>-Muestro la pregunta y la respuesta del quiz indicado");
  log("add-Añadir nuevo quiz interactivamente");
  log("delete <id>- Borrar el quiz indicado");
  log("edit <id>-Editar el quiz indicado");
  log("test <id>-Probar el quiz indicado");
  log("p|play-Jugar a preguntar aleatoriamente todos los quizzes");
  log("credits-Creditos");
  log("q|quit-Salir del programa");
  rl.prompt();
};

exports.quitCmd=rl=>{
  rl.close();
  rl.prompt();
};


const makeQuestion = (rl,text) => {
  return new Sequelize.Promise((resolve,reject)=> {
    rl.question(colorize(text,'red'),answer => {
     resolve(answer.trim());
    });
  });
};

exports.addCmd=rl=>{
 makeQuestion(rl,'Introduzca una pregunta: ')
 .then(q => {
   return makeQuestion(rl,'Introduzca la respuesta')
   .then(a => {
     return {question: q, answer: a};
    });
  })
 .then(quiz => {
   return models.quiz.create(quiz);
 })
 .then((quiz) => {
   log(`${colorize('Se ha añadido','magenta')}:  ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer}`);
 })
 .catch(Sequelize.ValidationError,error=> {
   errorlog('El quiz es erroneo.');
  error.errors.forEach(({message}) => errorlog(message));
 })
 .catch(error => {
   errorlog(error.message);
 })
 .then(() => {
   rl.prompt();
 }); 
};

exports.listCmd=rl=>{
  models.quiz.findAll()
  .each(quiz => {
    log(`[${colorize(quiz.id,'magenta')}]:  ${quiz.question}`);
  })
  .catch(error => {
    errorlog(error.message);
  })
  .then(() => {
    rl.prompt();
  })
};

const validateId=id =>{
  return new Sequelize.Promise((resolve,reject) => {
    if (typeof id=== "undefined"){
      reject(new Error(`Falta el parámetro <id>.`));
    }else {
      id=parseInt(id);
      if(Number.isNaN(id)){
        reject(new Error(`El valor del parámetro <id> no es un número.`));
      }else {
        resolve(id);
      }
    }
  });
};




exports.showCmd= (rl,id) =>{
  validateId(id)
  .then(id => models.quiz.findById(id))
  .then(quiz => {
    if(!quiz) {
      throw new Error(`No existe un quiz asociado al id=${id}.`);
    }
    log(`[${colorize(quiz.id,'magenta')}]:  ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer}`);
  })
  .catch(error => {
    errorlog(error.message);
  })
  .then(() => {
    rl.prompt();
  });
};

exports.testCmd = (rl,id) => {
    
  validateId(id)
  .then(id => models.quiz.findById(id))
  .then(quiz => {
    if (!quiz) {
      throw new Error(`No existe un quiz asociado al id=${id}.`);
    }
    log(` [${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
    return makeQuestion(rl, ' Introduzca la respuesta: ')
    .then(a => {
      if(quiz.answer.toUpperCase() === a.toUpperCase().trim()){
        log("Su respuesta es correcta");
        biglog('Correcta', 'green');
      } else{
        log("Su respuesta es incorrecta");
        biglog('Incorrecta', 'red');
      }
    });
    
  })
  .catch(error => {
    errorlog(error.message);
  })
  .then(() => {
    rl.prompt();
  });
};

exports.playCmd = rl => {
  
    let score = 0;
    let toBePlayed = [];

    models.quiz.findAll({raw:true})
    .then(quizzes=>{
      toBePlayed=quizzes;
    })
    

    const playOne=() =>{
    return Promise.resolve()
    .then(()=> {
     
    

    if(toBePlayed.length <= 0){
      console.log("SE ACABO");
      return;
    }

    let pos=Math.floor(Math.random()*toBePlayed.length);
    let quiz=toBePlayed[pos];
    toBePlayed.splice(pos,1);

    return makeQuestion(rl,quiz.question)
    .then(answer => {
      if(answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim()){
        score++;
        console.log("chachi");
        return playOne();
      }else{
        console.log("CACA");
      }
    })
  })
  }

 models.quiz.findAll({raw:true})
 .then(quizzes=>{
    toBePlayed=quizzes;
  })
 .then(() => {
  return playOne();
 })

 .catch(e => {
  consle.log("Error: " + e);
 })
 .then(() => {
  console.log(score);
  rl.prompt();
 })
 
};

exports.deleteCmd = (rl,id) =>{
  validateId(id)
  .then(id => models.quiz.destroy({where:{id}}))
  .catch(error => {
    errorlog(error.message);
  })
  .then(() => {
    rl.prompt();
  });
};

exports.editCmd= (rl,id) =>{
  validateId(id)
  .then(id => models.quiz.findById(id))
  .then(quiz => {
    if(!quiz){
      throw new Error(`No existe un quiz asociado al id=${id}.`);
    }

    process.stdout.isTTY && setTimeout(() =>{rl.write(quiz.question)},0);
    return makeQuestion(rl,'Introduzca la pregunta: ')
    .then(q => {
      process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);
      return makeQuestion(rl, ' Introduzca la respuesta ')
      .then(a => {
        quiz.question = q;
        quiz.answer = a;
        return quiz;
      });
    });
  })
  .then(quiz =>{
    return quiz.save();
  })
  .then(quiz => {
    log(`Se ha cambiado el quiz ${colorize(quiz.id,'magenta')} por: ${quiz.question} ${colorize('=>','magenta')}  ${quiz.answer}`);
  })
  .catch(Sequelize.ValidationError, error => {
    errorlog('El quiz es erroneo:');
    error.errors.forEach(({message})=> errorlog(message));
  })
  .catch(error => {
    errorlog(error.message);
  })
  .then(() => {
    rl.prompt();
  });
};

exports.creditsCmd=rl=>{
  log("Autores de la practica:","green");
  log("ALVARO OLLERO","green");
  rl.prompt();
};

