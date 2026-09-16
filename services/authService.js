import { User } from "../models/User"
import admin from "firebase-admin"

if(!admin.apps.length){
    admin.initializeApp({
        credential: admin.credential.applicationDefault()
    })
}