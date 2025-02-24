import simpleGit from "simple-git";
import logger from '../services/logger.js'
import fs from 'fs';

const localPath = process.env.REPO_PATH || "./data/repo";
const remotePath = process.env.REPO_URL || "https://github.com/KestrelsDevelopment/KestrelsNest";

async function cloneRepo() {
    if (!fs.existsSync(localPath)) {
        try {
            logger.data("Repository not found locally. Cloning...");
            const git = simpleGit();
            await git.clone(remotePath, localPath);
            logger.data("Repository cloned successfully.");
        } catch (err) {
            logger.error(`Error cloning git repository: ${err}`);
        }
    } else {
        logger.data("Repository already exists locally. Skipping clone.");
    }
}

async function pullRepo() {
    
    try {
        let repoGit = simpleGit(localPath);
        let result = await repoGit.pull()
        logger.data(`Repository Pulled: ${JSON.stringify(result)}`);
    }catch(err) {
        logger.error(`Error Pulling git repository: ${err}`);
    }
}

export async function startAutoUpdate(interval = 300000) {
    
    // initializing repo if not already initialized
    await cloneRepo();
    
    // Puling the Repo
    await pullRepo();

    logger.info("Starting auto-update of git repo...");
    
    return setInterval(pullRepo, interval);
}