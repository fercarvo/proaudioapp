class ProMedia {
    constructor(video) {
      /*
                 redacted for clarity
      */
        this.canvas = document.createElement('canvas');
        this.video = video;
        this.devices = [];
        this.currentDevice = 0;
    }
  
    fitImage(image) {
      /*
                 redacted for clarity
      */
    }
  
    async boot() {
        //return new Promise((resolve, reject) => {
            var devices = await navigator.mediaDevices.enumerateDevices()
            this.devices = devices.filter(dev => dev.kind === 'videoinput');
            return this.devices
            /*}).catch((err) => {
                reject(err);
            });*/
        //});
    }
  
    async start() {
        await this.boot();
        var stream = await navigator.mediaDevices.getUserMedia({
            video: {
                deviceId: this.devices[this.currentDevice].deviceId,
            },
            audio: false,
        })

        this.streamRef = stream;
        this.video.srcObject = stream;
        this.video.play();
        /*this.loop = new Loop(
            { fps: 60, frameskip: 17},
            frame => {
                if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
                    this.fitImage(this.video);
                }
            },
            frame => {}
        );
        this.loop.start();



      this.boot().then((devices) => {
          navigator.mediaDevices
              .getUserMedia({
                  video: {
                      deviceId: this.devices[this.currentDevice].deviceId,
                  },
                  audio: false,
              })
              .then(stream => {
                  this.streamRef = stream;
                  this.video.srcObject = stream;
                  this.video.play();
                  this.loop = new Loop(
                      { fps: 60, frameskip: 17},
                      frame => {
                          if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
                              this.fitImage(this.video);
                          }
                      },
                      frame => {}
                  );
                  this.loop.start();
              })
              .catch(err => {        
              });
      });
      */
    }
  
    stop() {
      this.streamRef.getTracks().forEach(track => track.stop());
      //this.loop.stop();
    }
  
    export() {
        return new Promise((resolve, reject) => {
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;
            this.canvas.getContext('2d').drawImage(this.video, 0, 0);

            this.canvas.toBlob(resolve, 'image/jpeg', 1)
        })
    }
  
    switch() {
        this.stop();
        const i = this.currentDevice;
        if (!!this.devices.length && i < this.devices.length - 1) {
            this.currentDevice += 1;
        } else {
            this.currentDevice = 0;
        }
        this.start();
    }
  }
  
  //export {ProMedia};