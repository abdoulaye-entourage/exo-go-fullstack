const Thing = require('../models/Thing');
const fs = require('fs')

exports.createThing = (req, res, next) => {
  const thingObject = req.body;
  delete thingObject._id;
  delete thingObject.userId;
  const thing = new Thing({
      ...thingObject,
      userId: req.auth.userId,
      imageUrl: req.file ? `${req.protocol}://${req.get('host')}/images/${req.file.filename}` : thingObject.imageUrl
  });

  thing.save()
  .then(() => { res.status(201).json({message: 'Objet enregistré !'})})
  .catch(error => { res.status(400).json( { error })})
};  


exports.modifyThing = (req, res, next) => {
  const thingObject = req.file ? {
      ...JSON.parse(req.body.thing),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  } : { ...req.body };

  // supprimer le userId pour eviter que quelqu'un crée un  objet à son nom puis le modifier et le réassigner à quelqu'un d'autre
  // Une mesure de sécurité. 
  delete thingObject._userId;

// chercher cette objet dans notre base de donnée pour la récuprer. 
// verifier si c'est bien l'utilisateur a qui apprtient cet objet, qui cherche à le modifier.
  Thing.findOne({_id: req.params.id})
      .then((thing) => {
          if (thing.userId != req.auth.userId) {
              res.status(401).json({ message : 'Not authorized'});
          } else {
              Thing.updateOne({ _id: req.params.id}, { ...thingObject, _id: req.params.id})
              .then(() => res.status(200).json({message : 'Objet modifié!'}))
              .catch(error => res.status(401).json({ error }));
          }
      })
      .catch((error) => {
          res.status(400).json({ error });
      });
};

  exports.deleteThing = (req, res, next) => {
    Thing.findOne({ _id: req.params.id}) 
    .then(thing => {
      if (thing.userId != req.auth.userId) {
        res.status(401).json({ message : 'Non-autorisé'});
      }else {
        const filename = thing.imageUrl.split('/images/'[1]);
        fs.unlink(`images/${filename}`, ()=> {
          Thing.deleteOne({ _id: req.params.id})
          .then(()=> {res.status(200).json({ message :'objet supprimé !'})})
          .catch(error => res.status(401).json({ error}));
        })
      }
    })
  }

  exports.getOneThing =(req, res, next) => {
    Thing.findOne({ _id: req.params.id })
      .then(thing => res.status(200).json(thing))
      .catch(error => res.status(404).json({ error }));
  }
  
  exports.getAllThing = (req, res, next) => {
    Thing.find()
      .then(things => res.status(200).json(things))
      .catch(error => res.status(400).json({ error }));
  }