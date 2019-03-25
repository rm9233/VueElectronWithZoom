'use strict';
const {electron,dialog,app,BrowserWindow,shell,clipboard,nativeImage,Menu} = require('electron');
const path = require('path')
const os = require('os').platform();


var ZOOMSDKMOD = require("./static/zoom/windows/zoom_sdk.js")
var initoptions={
    path:'./bin/',
    threadsafemode:0,
    ostype:ZOOMSDKMOD.ZOOM_TYPE_OS_TYPE.WIN_OS,
}

const zoomsdk = ZOOMSDKMOD.ZoomSDK.getInstance(initoptions)
const webdomain = 'https://www.zoom.us';

var zoomauth = null
var zoommeeting = null
var zoomaudio = null
var zoomvideo = null
var zoomshare = null
var zoomannotation = null
var zoomuicontroller = null
var mymeetinguserid = 0
// const app = electron.app;
// const BrowserWindow = electron.BrowserWindow;

var mainWindow = null;
var loginWindow = null;
var startjoinWindow = null;
var waitingWindow = null;
var inmeetingWindow = null;

if (process.env.NODE_ENV !== 'development') {
    global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

require('electron-debug')({ showDevTools: true })

const winURL = process.env.NODE_ENV === 'development'
    ? `http://localhost:9080`
    : `file://${__dirname}/index.html`


function ProcSDKReady(key,secret){
    var options={
        authcb:sdkauthCB,
        logincb:loginretCB,
        logoutcb:null,
    }
    zoomauth = zoomsdk.GetAuth(options);
    // sdk直接授权登录后弹出用户登录页面(可以实现自己的注册逻辑)
    console.error(key);
    console.error(secret);
    sdkauth(key, secret);
}

// function apicallresultcb(apiname, ret){
//     if ('InitSDK' == apiname && ZOOMSDKMOD.ZoomSDKError.SDKERR_SUCCESS == ret){
//         ProcSDKReady()
//     }
//     else if ('CleanupSDK' == apiname){
//         app.quit();
//     }
// }

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

        console.log("auth done");

        // showAuthwindow(); // 自动授权完成后, 出现登录窗口
    }
}

function sdkauth(appkey, appsecret){
    let result = zoomauth.SDKAuth(appkey, appsecret);
    console.log("666666");
    console.log(result);
    console.log("7777");
}

function loginretCB(status){
    console.log("8888");
    console.log(status);
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
    zoomauth.Login(username, psw, false);
}

function audiostatuscb(userid, status){

}

function videostatuscb(userid, status){
    console.log(status,'==========')
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
        username: username,   //昵称
        psw: psw.toString(),           //密码
        participantid: participantid.toString() //学生id
    }
    // console.log(JSON.stringify(opt),'********')
    // var opt ={ meetingnum: 245374710,
    //     username: '945407',
    //     psw: '123',
    //     participantid: '123456' }
    console.log(JSON.stringify(opt),'######')
    zoommeeting.JoinMeetingWithoutLogin(opt);
}

function leave(endMeeting){
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
    const iconImage = nativeImage.createFromPath(path.join(__dirname, '../assets/img/icon-logo-black.png'));
    dialog.showMessageBox({
        type: 'info',
        buttons: ['取消', '确定'],
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
const {ipcMain} = require('electron')
ipcMain.on('joinZoom',(event,arg1, arg2, arg3,arg4,arg5)=>{

    if(arg1 =='startliveTelecast'){
        console.log(arg1,arg2,arg3,arg4,arg5,'==========')
        join(Number(arg2),arg3,arg4,arg5)
    } else if(arg1 =='initKey'){
        console.log(arg2,arg3)
        var opts = {
            webdomain:webdomain,
            langid:ZOOMSDKMOD.ZoomSDK_LANGUAGE_ID.LANGUAGE_Chinese_Simplified,
        }
        console.log("11111");
        var ret = zoomsdk.InitSDK(opts);
        console.log("22222");
        var optMonitorUIAction={
            uiacitonCB:uiacitoncb
        }
        /* windows need do
        zoomsdk.StartMonitorUIAction(optMonitorUIAction)
        */
        if (0 == initoptions.threadsafemode && ZOOMSDKMOD.ZoomSDKError.SDKERR_SUCCESS == ret){
            console.log("3333");
            ProcSDKReady(arg2, arg3);
            console.log("44444");
        }
    }

})

function aotoUpdate(){
    var updateFeed = 'https://wuhao-file001.oss-cn-huhehaote.aliyuncs.com/dome/latest'
    if (process.env.NODE_ENV !== 'development') {
        updateFeed = os === 'darwin' ?
            'https://wuhao-file001.oss-cn-huhehaote.aliyuncs.com/dome/latest' :
            'http://download.mysite.com/releases/win32';
    }
}
app.on('window-all-closed', function () {
    if (process.platform != 'darwin') {
        zoomsdk.StopMonitorUIAction()
        zoomsdk.CleanupSDK()
        if (0 == initoptions.threadsafemode){
            app.quit()
        }
    }
});


function uiacitoncb(type, msgid, hwnd){

}
function createWindow () {
    Menu.setApplicationMenu(null)
    mainWindow = new BrowserWindow({
        width: 1024,
        minWidth: 1024,
        minHeight:680,
        height: 840,
        frame:false});
    mainWindow.show()
    mainWindow.loadURL(winURL)

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
    // if (0 == initoptions.threadsafemode && ZOOMSDKMOD.ZoomSDKError.SDKERR_SUCCESS == ret){
    //     ProcSDKReady();
    // }
    mainWindow.webContents.openDevTools({detach:true})
    mainWindow.on('closed', () => {
        mainWindow = null
    })
    mainWindow.on('maximize',(event, arg)=>{
        event.sender.send("ln-maximize",0);
    })
    // event(mainWindow, app);

}

const shouldQuit = app.makeSingleInstance((commandLine, workingDir) => {
    if (mainWindow) {
        mainWindow.isMinimized() && mainWindow.restore()
        mainWindow.focus()
    }
})
if (shouldQuit) {
    app.quit()
}
app.on('ready', createWindow)
//登录窗口最小化
ipcMain.on('window-min',function(){
    mainWindow.minimize();
})
//登录窗口最大化
ipcMain.on('window-max',function(){
    if(mainWindow.isMaximized()){
        mainWindow.restore();
    }else{
        mainWindow.maximize();
    }
})
ipcMain.on('window-close',function(){
    mainWindow.close();
})
ipcMain.on('close-app', () => {
    // 通知关闭
    mainWindow.close();
});
ipcMain.on('max-app', () => {
    if (mainWindow.isMaximized()) {
        // 若已经是最大化了，则还原
        mainWindow.unmaximize()
    } else {
        // 最大化窗口
        mainWindow.maximize()
    }
});
ipcMain.on('min-app', () => {
    // 最小化
    mainWindow.minimize();
});