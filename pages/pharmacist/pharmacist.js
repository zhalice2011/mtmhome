const util = require('../../utils/util.js')
const serverConfig = require('../../config/index.js').serverConfig
const app = getApp()

Page({
    data: {
        motto: '周达理',
        userInfo: {},
        hasUserInfo: false,
        canIUse: wx.canIUse('button.open-type.getUserInfo')
    },
    onLoad: function () {
        // if (app.globalData.userInfo) {
        //     this.setData({
        //         userInfo: app.globalData.userInfo,
        //         hasUserInfo: true
        //     })
        // } else if (this.data.canIUse) {
        //     // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
        //     // 所以此处加入 callback 以防止这种情况
        //     app.userInfoReadyCallback = res => {
        //         this.setData({
        //             userInfo: res.userInfo,
        //             hasUserInfo: true
        //         })
        //     }
        // } else {
        //     // 在没有 open-type=getUserInfo 版本的兼容处理
        //     wx.getUserInfo({
        //         success: res => {
        //             console.log("点击微信建档",res)
        //             app.globalData.userInfo = res.userInfo
        //             this.setData({
        //                 userInfo: res.userInfo,
        //                 hasUserInfo: true
        //             })
        //         }
        //     })
        // }
    },
    // 绑定点击事件
    createMember: function (e) {
        const a = parseInt(Math.random() * 10)
        this.setData({
            name: '您的幸运号码是:' + a
        })
        // 发送网络请求
        var url = serverConfig.url + '/wechat'
        wx.request({
            url: url, //仅为示例，并非真实的接口地址
            data: {
                x: '1',
                y: '2'
            },
            header: {
                'content-type': 'application/json' // 默认值
            },
            success: function (res) {
                console.log(res.data)
            }
        })
    },
    // 获取用户详细的信息
    getUserInfo: function(e) {
        console.log("周达理传送给后端的数据",e)
        var userInfo = e.detail.userInfo
        var openid = wx.getStorageSync('openid') || ''       
        wx.request({
            url: serverConfig.url + '/user/update',
            data: {
                openid: openid,
                nickname: userInfo.nickName,
                avatarUrl: userInfo.avatarUrl,
                city: userInfo.city,
                country: userInfo.country,
                province: userInfo.province,
                gender: userInfo.gender
            },
            method: 'POST',
            success: function (res) {
                console.log("后端返回的数据",res);
            }
        });

    },
    // minui测试
    showToast: function () {
        let $toast = this.selectComponent(".J_toast")
        $toast && $toast.show()
    }
})
