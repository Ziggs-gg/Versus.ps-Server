module.exports = {
    apps: [{
        name: 'nodeserver', //App name
        script: './app.js', //실행할 스크립트
        instances: -1, //CUP 코어 수 만큼 프로세스 생성(-1:코어수만큼 프로세스 생성)
        exec_mode: "cluster", //CPU 사용을 위한 클러스터 모드
    }]
  };