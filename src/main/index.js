'use strict';
const {electron,dialog,app,BrowserWindow,shell,clipboard,Menu,webFrame} = require('electron');
const {ipcMain} = require('electron')
var ZOOMSDKMOD = require(__dirname+"/static/zoom/mac/zoom_sdk.js")
var initoptions={
    path:'',
    threadsafemode:0,
    ostype:ZOOMSDKMOD.ZOOM_TYPE_OS_TYPE.MAC_OS,
}
const zoomsdk = ZOOMSDKMOD.ZoomSDK.getInstance(initoptions)
const webdomain = 'https://www.zoom.us';
const MainbaseUrl ='http://edudemo.lnart.com/'

var zoomauth = null
var zoommeeting = null
var zoomaudio = null
var zoomvideo = null
var zoomshare = null
var zoomannotation = null
var zoomuicontroller = null
var mymeetinguserid = 0
var mainWindow = null;

if (process.env.NODE_ENV !== 'development') {
    global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

require('electron-debug')({ showDevTools: true })

const winURL = process.env.NODE_ENV === 'development'
    ? `http://localhost:9080`
    : `file://${__dirname}/index.html`

let template = [
    {
        label: "Application",
        submenu: [
            { label: "关于我们", selector: "orderFrontStandardAboutPanel:" },
            { type: "separator" },
            { label: "退出", accelerator: "Command+Q", click: function() { app.quit(); }}
        ]},
    {
        label:'菜单',
        submenu: [{
            label: '最小化',
            accelerator: 'CmdOrCtrl+M',
            role: 'minimize'
        }, {
            label: '关闭',
            accelerator: 'CmdOrCtrl+W',
            role: 'close'
        }, {
            type: 'separator'
        }, {
            label: '重新打开窗口',
            accelerator: 'CmdOrCtrl+Shift+T',
            enabled: false,
            key: 'reopenMenuItem',
            click: function () {
                app.emit('activate')
            }
        }]
    }
]

function ProcSDKReady(key,secret){
    var options={
        authcb:sdkauthCB,
        logincb:loginretCB,
        logoutcb:null,
    }
    zoomauth = zoomsdk.GetAuth(options);
    // sdk直接授权登录后弹出用户登录页面(可以实现自己的注册逻辑)
    sdkauth(key, secret);

}

function sdkauthCB(status){
    if (ZOOMSDKMOD.ZOOMAUTHMOD.ZoomAuthResult.AUTHRET_SUCCESS == status){
        var opts = {
            ostype:ZOOMSDKMOD.ZOOM_TYPE_OS_TYPE.MAC_OS,
            meetingstatuscb:meetingstatuscb,
            meetinguserjoincb:meetinguserjoincb,
            meetinguserleftcb:meetinguserleftcb,
            meetinghostchangecb:meetinghostchangecb,
        }
        zoommeeting = zoomsdk.GetMeeting(opts)

        var optsaudio = {
            audiostatuscb:audiostatuscb,
        }
        zoomaudio = zoommeeting.GetMeetingAudio(optsaudio)

        var optsvideo = {
            videostatuscb:videostatuscb,
        }
        zoomvideo = zoommeeting.GetMeetingVideo(optsvideo)

        zoomshare = zoommeeting.GetMeetingShare()

        zoomannotation = zoommeeting.GetAnnotationCtrl()
        zoomuicontroller = zoommeeting.GetMeetingUICtrl()

        // showAuthwindow(); // 自动授权完成后, 出现登录窗口
    }
}

function sdkauth(appkey, appsecret){
    let result = zoomauth.SDKAuth(appkey, appsecret);
}

function loginretCB(status){
    switch(status)
    {
        case ZOOMSDKMOD.ZOOMAUTHMOD.ZoomLoginStatus.LOGIN_SUCCESS:
            // showSatrtJoinWindow();
            break;
        case ZOOMSDKMOD.ZOOMAUTHMOD.ZoomLoginStatus.LOGIN_PROCESSING:
            break;
        case ZOOMSDKMOD.ZOOMAUTHMOD.ZoomLoginStatus.LOGIN_FAILED:
            break;
        default:
            break;
    }
}
// 第二步:登录
function login(username, psw){
    // if (username && psw)
    // {
    //     showWaitingWindow();
    // }
    zoomauth.Login(username, psw, false);
}

function audiostatuscb(userid, status){

}

function videostatuscb(userid, status){

}
function meetinguserjoincb(useritem) {
    console.log('加入直播meetinguser回调',useritem.isme)
    if (useritem.isme == 'true')
        mymeetinguserid = useritem.userid
}

function meetinguserleftcb(userid){

}

function meetinghostchangecb(userid){

}
function meetingstatuscb(status, errorcode) {
    console.log('会议中 回调',errorcode,status)
    if(status == ZOOMSDKMOD.ZOOMMEETINGMOD.ZoomMeetingStatus.MEETING_STATUS_FAILED){
        console.log('会议中 回调66666',errorcode,status)
        showDialog('提示', '打开Zoom失败', '确定', function () {
            console.log('回调')
        })
    }else{
        switch (status)
        {
            case ZOOMSDKMOD.ZOOMMEETINGMOD.ZoomMeetingStatus.MEETING_STATUS_CONNECTING:
                console.log('链接')
            case ZOOMSDKMOD.ZOOMMEETINGMOD.ZoomMeetingStatus.MEETING_STATUS_DISCONNECTING:
            case ZOOMSDKMOD.ZOOMMEETINGMOD.ZoomMeetingStatus.MEETING_STATUS_RECONNECTING:
            // break;
            case ZOOMSDKMOD.ZOOMMEETINGMOD.ZoomMeetingStatus.MEETING_STATUS_INMEETING:
                console.log('链接成功')
            case ZOOMSDKMOD.ZOOMMEETINGMOD.ZoomMeetingStatus.MEETING_STATUS_AUDIO_READY:
            // showInMeetingWindow();
            // break;
            case ZOOMSDKMOD.ZOOMMEETINGMOD.ZoomMeetingStatus.MEETING_STATUS_FAILED:
                // console.log('MEETING_STATUS_FAILED')
                break;
            case ZOOMSDKMOD.ZOOMMEETINGMOD.ZoomMeetingStatus.MEETING_STATUS_ENDED:
                break;
            default:
                break;
        }
    }

}

function start(meetingnum){
    var opt = {
        meetingnum:meetingnum
    }
    zoommeeting.StartMeeting(opt);
}

function join(meetingnum, username,psw,participantid){
    var opt ={ meetingnum: meetingnum, //会议id
        username: username.toString(),   //昵称
        psw: psw.toString(),           //密码
        participantid: participantid.toString() //学生id
    }
    console.log(JSON.stringify(opt),'********')
    // var opt ={ meetingnum: 245374710,
    //     username: '865142246',
    //     psw: '123',
    //     participantid: '123456' }
    zoommeeting.JoinMeetingWithoutLogin(opt);
}

function leave(endMeeting){
    //zoomaudio.MeetingAudio_JoinVoip()
    /*
    var mute = {
      userid:mymeetinguserid,
      allowunmutebyself:true // only take affect when userid===0, host muteall
    }
    zoomaudio.MeetingAudio_MuteAudio(mute)
    */
    /*
    var unmute = {
      userid: mymeetinguserid,
    }
    zoomaudio.MeetingAudio_UnMuteAudio(unmute)
    */
    //zoomaudio.MeetingAudio_LeaveVoip()
    //zoomvideo.MeetingVideo_MuteVideo()
    //zoomvideo.MeetingVideo_UnMuteVideo()

    //var userlist = zoommeeting.GetUserList()

    /*
    var shareapp = {
      apphandle:134484 //app mainwindow handle.
    }
    zoomshare.MeetingShare_StartAppShare(shareapp)
    */
    //return
    var opt = {
        endMeeting:endMeeting
    }
    zoommeeting.LeaveMeeting(opt);
}

function mute(userid)
{
    var opts = {
        userid: userid,
        allowunmutebyself: 'false'
    }

    zoomaudio.MeetingAudio_MuteAudio(opts)
}

function unmute(userid)
{
    var opts = {
        userid: userid,
    }
    zoomaudio.MeetingAudio_UnMuteAudio(opts)
}

function joinVoip()
{
    var opts = {}
    zoomaudio.MeetingAudio_JoinVoip(opts)
}

function leaveVoip()
{
    var opts = {}
    zoomaudio.MeetingAudio_LeaveVoip(opts)
}

function muteVideo()
{
    var opts = {}
    zoomvideo.MeetingVideo_MuteVideo(opts)
}

function unmuteVideo()
{
    var opts = {}
    zoomvideo.MeetingVideo_UnMuteVideo(opts)
}

function shareApp(apphandle)
{
    var opts={
        apphandle:apphandle
    }
    zoomshare.MeetingShare_StartAppShare(opts)
}

function shareDesktop(monitorid)
{
    var opts={
        monitorid:monitorid
    }
    zoomshare.MeetingShare_StartMonitorShare(opts)
}

function stopShare(){
    var opts={}
    zoomshare.MeetingShare_StopShare(opts)
}

function setTool(viewtype, tooltype)
{
    var opts ={
        viewtype: viewtype,
        type:tooltype
    }
    zoomannotation.Annotaion_SetTool(opts)
}

function setClear(viewtype, cleartype)
{
    var opts ={
        viewtype: viewtype,
        type:cleartype
    }
    zoomannotation.Annotaion_Clear(opts)
}

function undo(viewtype)
{
    var opts ={
        viewtype: viewtype,
    }
    zoomannotation.Annotaion_Undo(opts)
}

function redo(viewtype)
{
    var opts ={
        viewtype: viewtype,
    }
    zoomannotation.Annotaion_Redo(opts)
}

function startAnnotation(viewtype, left, top)
{
    var opts ={
        viewtype: viewtype,
        left:left,
        top: top,
    }
    zoomannotation.Annotaion_StartAnnotation(opts)
}

function stopAnnotation(viewtype)
{
    zoomannotation.Annotaion_StopAnnotation(viewtype)
}

function showAudio(show)
{
    if(show)
        zoomuicontroller.MeetingUI_ShowJoinAudioDlg()
    else
        zoomuicontroller.MeetingUI_HideJoinAudioDlg()
}

function showChat(show)
{
    var opts ={
        left: 200,
        top: 200
    }
    if(show)
        zoomuicontroller.MeetingUI_ShowChatDlg(opts)
    else
        zoomuicontroller.MeetingUI_HideChatDlg()
}

function showPlist(show)
{
    var opts ={
        show:show
    }
    zoomuicontroller.MeetingUI_ShowParticipantsListWnd(opts)

}

function showToolbar(show)
{
    var opts ={
        show:show
    }
    zoomuicontroller.MeetingUI_ShowBottomFloatToolbarWnd(opts)
}

function showFitbar(show)
{
    var opts ={
        show:show
    }
    zoomuicontroller.MeetingUI_ShowSharingToolbar(opts)
}

function enterFullscreen(show)
{
    var opts ={
        bFirstView: 1,
        bSecView:0
    }
    if(show)
    {
        zoomuicontroller.MeetingUI_EnterFullScreen(opts)
    }else{
        zoomuicontroller.MeetingUI_ExitFullScreen(opts)
    }
}

function switchToWall()
{
    zoomuicontroller.MeetingUI_SwitchToVideoWall()
}

function switchToActive()
{
    zoomuicontroller.MeetingUI_SwtichToAcitveSpeaker()
}

function switchFloatToActive()
{
    zoomuicontroller.MeetingUI_SwitchFloatVideoToActiveSpkMod()
}

function switchFloatToGallery()
{
    zoomuicontroller.MeetingUI_SwitchFloatVideoToGalleryMod()
}

function switchFloatToActive()
{
    zoomuicontroller.MeetingUI_SwitchFloatVideoToActiveSpkMod()
}

function changeFloatActiveSpkVideoSize()
{
    var opts = {
        floatvideotype:2
    }
    zoomuicontroller.MeetingUI_ChangeFloatActiveSpkVideoSize(opts)
}
function showDialog(message, detail, positiveButton, callback) {
    // const iconImage = nativeImage.createFromPath(path.join(__dirname, '../assets/icon.png'));
    dialog.showMessageBox({
        type: 'info',
        buttons: ['Cancel', positiveButton],
        defaultId: 1,
        cancelId: 0,
        title: message,
        message,
        detail,
        // icon: iconImage,
    }, callback);
}
function moveFloatVideo()
{
    var opts ={
        left: 200,
        top: 200
    }
    zoomuicontroller.MeetingUI_MoveFloatVideoWnd(opts)
}

function uiacitoncb(type, msgid, hwnd){

}

ipcMain.on('joinZoom',(event,arg1, arg2, arg3,arg4,arg5)=>{

    if(arg1 =='startliveTelecast'){
        console.log(arg1,arg2,arg3,arg4,arg5,'==========')
        join(Number(arg2),arg3,arg4,arg5)
    }else if(arg1 =='initKey'){
        console.log(arg2,arg3)
        var opts = {
            webdomain:webdomain,
            langid:ZOOMSDKMOD.ZoomSDK_LANGUAGE_ID.LANGUAGE_Chinese_Simplified,
        }
        var ret = zoomsdk.InitSDK(opts);
        var optMonitorUIAction={
            uiacitonCB:uiacitoncb
        }
        /* windows need do
        zoomsdk.StartMonitorUIAction(optMonitorUIAction)
        */
        if (0 == initoptions.threadsafemode && ZOOMSDKMOD.ZoomSDKError.SDKERR_SUCCESS == ret){
            ProcSDKReady(arg2, arg3);
        }
    }
})


app.on('window-all-closed', function () {
    if (process.platform != 'darwin') {
        zoomsdk.StopMonitorUIAction()
        zoomsdk.CleanupSDK()
        if (0 == initoptions.threadsafemode){
            app.quit()
        }
    }
});

ipcMain.on('window-close',function(){
    mainWindow.close();
    app.quit();
})

app.on('ready', createWindow)

function createWindow () {
    // TODO 临时注掉 因为无法copy信息
    let menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
    mainWindow = new BrowserWindow({
        webPreferences: {
            javascript: true,
            plugins: true,
            nodeIntegration: true,
            webSecurity: false,
        },
        width: 1024,
        minWidth: 1024,
        minHeight:750,
        height: 750,
        title: app.getName(),
        // center: true,
        titleBarStyle: 'hidden',
        useContentSize: true,
        fullscreen:false,
        frame:false});
    mainWindow.loadURL(winURL)
    //mainWindow.loadURL('file://' + __dirname + '/splash.html')
    process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

    mainWindow.webContents.openDevTools({detach:true})
    mainWindow.on('closed', () => {
        mainWindow = null
    })
    // event(mainWindow, app);
}

// Install `vue-devtools`
require('electron').app.on('ready', () => {
    let installExtension = require('electron-devtools-installer')
    installExtension.default(installExtension.VUEJS_DEVTOOLS)
        .then(() => {})
        .catch(err => {
            console.log('Unable to install `vue-devtools`: \n', err)
        })
})

