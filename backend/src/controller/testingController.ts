import { PrismaClient } from '@prisma/client';
import * as tf from '@tensorflow/tfjs-node'
import { Request, Response } from 'express'
import * as jwt from 'jsonwebtoken'
import multer from 'multer';
import path from 'path';
import { getId } from './authController';
import * as fs from 'fs';
import { TFSavedModel } from '@tensorflow/tfjs-node/dist/saved_model';
import { loadGraphModel } from '@tensorflow/tfjs-node';
import { ArrayMap } from '@tensorflow/tfjs-core/dist/types';

const prisma = new PrismaClient()

export const uploadStorage = multer.diskStorage({
    destination : (req:Request, file, cb) => {
        cb(null, './storage/testing')
    },
    filename : (req :Request, file , cb) => {
        cb(null, file.fieldname + '_' + Date.now() + path.extname(file.originalname))
    }
})

export const uploader = multer({
    storage : uploadStorage,
    limits : {
        fileSize : 100000
    },
    fileFilter(req : Request, file, cb) {
        if(!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
            return cb(new Error('Invalid File Type'))
        }
        cb(null, true)
    }
})

const loadModel = (path : string) => {
    const model = tf.loadLayersModel(path)
    return model
}

export const testingDetectIsFood = async (req: Request, res:Response) => {
    const path = req.file?.path as string
    // console.log(path)
    var option = {
        root : './'
    }

    // const testingLoad = await loadGraphModel('file://src/model/food5kdaffa/model.json')

    // const modelPath = fs.readFileSync( `./../model/food5kdaffa/model.json`)
    const isFoodModel = await tf.loadLayersModel('file://src/model/food5kdaffa/model.json')
    const FoodClass = await tf.loadLayersModel('file://src/model/Vall_Loss_Best_Model_11_Class/model.json')
    // const isFoodModel = loadModel('file://src/model/food5kdaffa/model.json');
    // const loadedModel = await isFoodModel
    const metadata = fs.readFileSync('./src/model/food5kdaffa/model.json')
    const labels = JSON.parse(metadata.toString()).labels
    
    console.log(typeof(labels))
    
    const image = fs.readFileSync( `./${path}`)
    

    const decoded = tf.node.decodeImage(image)
    // decoded.reshape([200,200,3])
    // console.log('decoded ' + decoded.shape)
    const resized = tf.image.resizeBilinear(decoded, [200,200])
    // console.log('resized ' + resized.shape )
    const expanded = tf.expandDims (resized, 0)
    // console.log('expanded ' + expanded.shape)
    // console.log(tf.node.decodeImage(image))
    const result = (isFoodModel.predict(expanded) as tf.Tensor).argMax(1).dataSync()
    const isFoodLabel = ['Food', 'non-Food']
    console.log(isFoodLabel[result[0]])
    // const data = await result.data();

    // testingLoad.execute(expanded)
    const label = ['Bebek Goreng', 'Beef Burger', 'Cumi Cumi Goreng', 'Gulai Kambing', 'Mie Ayam', 'Rendang Sapi', 'Sayur Asem', 'Semur Jengkol', 'Sop Buntut', 'Soto Padang', 'Tekwan']
    console.log(label.length)

    const decodedClasses = tf.node.decodeImage(image)
    console.log(decodedClasses)
    const resizedClasses = tf.image.resizeBilinear(decodedClasses, [300,300]).div(tf.scalar(255))
    console.log(resizedClasses)
    const expandedClasses = tf.expandDims(resizedClasses, 0)
    console.log(expandedClasses.dataSync())
    let classResult = FoodClass.predict(expandedClasses) as tf.Tensor 
    console.log('Food Class Result: ')
    // Predict Classes
    
    const category = tf.argMax(classResult.dataSync())
    console.log(category.dataSync()[0])
    // const classidx = tf.argMax(classResults.dataSync()).dataSync()
    // console.log(classidx)
    // const classLabel = label[classidx]
    // console.log(classLabel)
    // console.log((classResult.argMax() as tf.Tensor).dataSync())
    res.send({ label : label[category.dataSync()[0]], prediction : (classResult).dataSync()})
    // console.log(classResult.dataSync().toString())
    // console.log(FoodClass.getOutputAt(0))
    // console.log('result :')
    // console.log(result)
    // var model: tf.LayersModel, images
    // tf.loadLayersModel('file://src/model/food5kdaffa/model.json')
    // .then(res => {
    //     model = res
    //     // console.log(model)
    // })
    // .then(modelInfo => {
    //     // console.log(modelInfo)
    //     images = fs.readFileSync('./' + path)
    //     const uint8array = new Uint8Array(images)
    //     return tf.node.decodeImage(uint8array)
    // })
    // .then(ImageTensor => {
    //     let input = tf.image.resizeBilinear(ImageTensor, [200,200])
    //     input = input.expandDims(0)
    //     const startTime = tf.util.now()
    //     let outputTensor = model.predict(input)
    //     console.log(outputTensor)
    // })
    // .catch(err => {
    //     console.log(err)
    // })
    // await res.sendFile(path, option)
    
    // await fs.unlinkSync(`./${path}`)
}


interface TOKENData {
    id : Number;
    email : String
}

export const decodeToken = ( req: Request, res:Response) => {
    const token = req.headers['auth'] as string || req.headers.authorization as string
    const decoded = jwt.decode(token, {complete : true})?.payload
    res.send({ message : (decoded as TOKENData).id })
}

export const testUploadImage = (req: Request, res: Response) => {
    console.log(req)
    res.send(req.body)
    // res.send({ message : 'Upload File Sukses'})
}

