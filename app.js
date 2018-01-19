const serverConfig = require('./config/index.js').serverConfig

//app.js
App({
  // 小程序启动之后 触发
  onLaunch: function () {
    
    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
    console.log("wx.getStorageSync",logs)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        console.log("第一次进入微信获取的值",res);
        // 存储code
        wx.request({
            url: serverConfig.url+'/user/login',
            data: {
                code: res.code
            },
            method: 'POST',
            success: function(res) {
                console.log("接受到的数据",res.data.data.openid)
                wx.setStorageSync('openid', res.data.data.openid)
                console.log("openid",wx.getStorageSync('openid'))
                
            }
        });
        
      }
    })
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId
              this.globalData.userInfo = res.userInfo
              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            }
          })
        }
      }
    })
  },
  globalData: {
    userInfo: null
  }
})
