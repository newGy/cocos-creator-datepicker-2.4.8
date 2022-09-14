
cc.Class({
    extends: cc.Component,

    properties: {
        radioList: [cc.Node]
    },

    onLoad() {
        this.posCount = null;
        this.cleanScale();
    },

    pulldownUpdate(count) {
        if (this.posCount == null){
            this.cleanScale();
            this.posCount = count;
        }
        this.node.opacity = 255;
        let dicUp = count - this.posCount;
        let radioList = this.radioList;
        let scale0 = 0.5 + dicUp / 100;
        let scale1 = 0.5 + dicUp / 200;
        let scale2 = 0.5 + dicUp / 300;
        radioList[0].scale = scale0 > 1.2 ? 1.2 : (scale0 < 0.5 ? 0.5 : scale0);
        radioList[1].scale = scale1 > 0.9 ? 0.9 : (scale1 < 0.5 ? 0.5 : scale1);
        radioList[2].scale = scale2 > 0.7 ? 0.7 : (scale2 < 0.5 ? 0.5 : scale2);
    },
    loosenAnim(callback) {
        this.radioList.forEach(radio => {
            let scl = radio.scale;
            let seq = cc.sequence(
                cc.spawn(cc.scaleTo(0.2, scl+0.2), cc.fadeTo(0.2, 200)),
                cc.spawn(cc.scaleTo(0.2, 1), cc.fadeOut(0.2)),
                cc.callFunc(() => {
                    this.cleanScale();
                    if (callback){
                        callback();
                    }
                })
            )
            radio.runAction(seq)
        });
    },

    cleanScale() {
        this.radioList.forEach(radio => {
            radio.stopAllActions();
            radio.scale = 0.5;
            radio.opacity = 255;
        });
        this.node.opacity = 0;
        this.posCount = null;
    },

    hide() {
        if(this.node){
            this.node.active = false;
        }
    },
    show() {
        if(this.node){
            this.node.active = true;
        }
    }
});
