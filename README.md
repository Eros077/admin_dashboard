# admin_dashboard
To try this simple web app you have to create a firebase proyect, don't worry, is easy!
The next step is to create a firestore project, with a collection called posts.
After that, create a storage project with a folder called "images" and another folder called "postImages" into it
Lastly set the firebase config: 
  - go to your firebase project, firebase console/settings/project settings/service accounts
  - copy and replace the firebase config on db.js with your config, don't forget your storage bucket

Docs:
Firebase Firestore: https://firebase.google.com/docs/firestore/quickstart?hl=es-419#web-modular-api
Firebase Storage: https://firebase.google.com/docs/storage/web/start?hl=es-419 //how to get the storage bucket for the config*
