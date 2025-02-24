import logger from '../services/logger.js'


const images = (req,res)=>{
    let reqURI = req.originalUrl;
    
    logger.debug('reqURI: ' + reqURI)
    
    res.status(200).json({message:  `You requested the following URI: ${reqURI}`})
}

export default images