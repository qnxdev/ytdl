const fs = require("fs");
const ytdl = require("ytdl-core");
const fetch = require("node-fetch");
const ffmpeg = require("fluent-ffmpeg");

let ffmpeg_path = "ffmpeg";
let basedir = "./downloads";

let i = 0;

async function download(url) {
    ytdl.getInfo(url).then(async info => {
        if(!fs.existsSync(basedir))fs.mkdirSync(basedir);
                
        let meta = `Upload date: ${info.videoDetails.uploadDate}\nLength: ${info.videoDetails.lengthSeconds}s\nCategory: ${info.videoDetails.category}\nChannel: ${info.videoDetails.ownerChannelName} [${info.videoDetails.author.external_channel_url} - ${info.videoDetails.ownerProfileUrl}]\nTitle: ${info.videoDetails.title}\nURL: ${info.videoDetails.video_url}\nAge restricted: ${info.videoDetails.age_restricted ? "yes" : "no"}\nPrivate: ${info.videoDetails.isPrivate ? "yes" : "no"}\nUnlisted: ${info.videoDetails.isUnlisted ? "yes" : "no"}`
        console.log(`{${i}} [\x1b[32mINFO\x1b[0m] Downloading video... ("${info.videoDetails.title}")`);
        if(info.videoDetails.category)meta+=`\nCategory: ${info.videoDetails.category}`
        let description = info.videoDetails.shortDescription;
        let keywords = info.videoDetails.keywords.join("\n");
        let dir = `${basedir}/${info.videoDetails.ownerChannelName.replace(/\//g,"")}/${info.videoDetails.title.replace(/\//g,"")}`
        if(!fs.existsSync(`${basedir}/${info.videoDetails.ownerChannelName.replace(/\//g,"")}`)) fs.mkdirSync(`${basedir}/${info.videoDetails.ownerChannelName.replace(/\//g,"")}`);
        if(fs.existsSync(dir))fs.rmdirSync(dir,{recursive:true})
        if(!fs.existsSync(dir))fs.mkdirSync(dir)
        fs.writeFileSync(`${dir}/meta.txt`,meta)
        fs.writeFileSync(`${dir}/description.txt`,description)
        fs.writeFileSync(`${dir}/tags.txt`,keywords)
        ytdl(url, { filter: format => format.container === "mp4" }).pipe(fs.createWriteStream(`${dir}/video.mp4`)).on("finish",async () => {
            console.log(`{${i}} [\x1b[32mINFO\x1b[0m] Successfully downloaded video "${info.videoDetails.title}" to folder ${dir}!`);
            if(process.argv.slice(2).length==i) {
                console.log("[\x1b[32mINFO\x1b[0m] All downloads finished!");
            }
            let mpeg = new ffmpeg({source:`${dir}/video.mp4`})
            .setFfmpegPath(ffmpeg_path)
            .toFormat("mp3")
            .saveToFile(`${dir}/audio.mp3`);
            fs.mkdirSync(`${dir}/RelatedVideos`);
            fetch(info.videoDetails.author.avatar).then(res => {
                if(fs.existsSync(`${basedir}/${info.videoDetails.ownerChannelName.replace(/\//g,"")}/avatar.png`))fs.unlinkSync(`${basedir}/${info.videoDetails.ownerChannelName.replace(/\//g,"")}/avatar.png`)
                res.body.pipe(fs.createWriteStream(`${basedir}/${info.videoDetails.ownerChannelName.replace(/\//g,"")}/avatar.png`))
            })
            info.related_videos.forEach(async video => {
                fs.mkdirSync(`${dir}/RelatedVideos/${video.title.replace(/\//g,"")}`)
                let oui = `Title: ${video.title}\nAuthor: ${video.author} (https://www.youtube.com/channel/${video.ucid})\nLength: ${video.length_seconds}s`
                fs.writeFileSync(`${dir}/RelatedVideos/${video.title.replace(/\//g,"")}/meta.txt`,oui)
                fetch(video.video_thumbnail).then(res => {
                    res.body.pipe(fs.createWriteStream(`${dir}/RelatedVideos/${video.title.replace(/\//g,"")}/thumbnail.png`))
                })
            })
        })
    }).catch(async err => {
        console.log(err)
        console.log(`{${i}} [\x1b[32mINFO\x1b[0m] Invalid video :(`)
    })
}

//Tutorial: https://www.youtube.com/watch?v=dQw4w9WgXcQ
process.argv.slice(2).forEach(async arg => {
    i++;
    download(arg);
})
