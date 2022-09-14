
cc.Class({
    extends: cc.Component,

    properties: {
        animNode: cc.Node
    },

    onLoad() {
        this.topAnim = this.animNode.getComponent(cc.Animation);
        this.hide();
    },

    hide() {
        this.node.active = false;
    },

    show() {
        this.node.active = true;
    },

    play(callback) {
        this.topAnim.play('refreshClip');
        this.unscheduleAllCallbacks();
        this.scheduleOnce(() => {
            if(callback){
                callback();
            }
        }, 1)
    },
});
