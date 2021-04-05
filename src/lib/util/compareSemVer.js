export default function compareSemVer(verA = '', verB = '') {
    const versionA = verA.split(".");
    const versionB = verB.split(".");
    // if(versionA.length !== 3 || versionB.length !== 3) {
    //     return null;
    // }
    for(let i=0; i<3; ++i) {
        const semVerA = Number(versionA[i]);
        const semVerB = Number(versionB[i]);
        if(semVerA > semVerB) {
            return 1;
        }
        else if(semVerA < semVerB) {
            return -1;
        }
        if (!isNaN(semVerA) && isNaN(semVerB)) return 1;
        if (isNaN(semVerA) && !isNaN(semVerB)) return -1;
    }

    return 0;
}