import { evalConnector } from '@/lib/deviceConnector';

export const getJobInfo = () => {
    let jobInfo;
    if (DEVICE_TYPE == 'd') {
        const appConfig = evalConnector({
            method: 'getGlobal',
            name: 'APP_SETTING',
        });
        jobInfo = appConfig.get('jobInfo')
    }else{
        jobInfo = localStorage.getItem('covi_user_jobInfo')
    }
    return jobInfo == 'NN' ? '' : jobInfo; //직무없음 ->빈값으로 보내도록(사이드이팩트방지)
};