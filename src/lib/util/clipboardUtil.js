export function secureCopy(text) {
    if(typeof navigator.clipboard === 'undefined') {
        /**
         * clipboard에 direct access가 불가능한 경우(브라우저 측 보안설정)
         * 
         * 임시 element를 생성하여 element 내용을 복사하는 방식으로 우회
         */
        const tempTextArea = document.createElement("textarea");
        tempTextArea.value = text;

        document.body.appendChild(tempTextArea);
        tempTextArea.focus();
        tempTextArea.select();

        try {
            // const status = document.execCommand('copy');
            document.execCommand('copy');
        } catch(err) {
            //
        }

        document.body.removeChild(tempTextArea);
        return;
    } else {
        // 
        navigator.clipboard.writeText(text);
    }
}