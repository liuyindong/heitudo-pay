//app.js
App({
  onLaunch: function () {

    var that = this;
    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        console.log(res.code)
        let openId = wx.getStorageSync('openId')

        //没有openid则获取保存本地

        wx.request({
          url: that.globalData.apiHost+'/hmj-users/getUserOpenId/' + res.code,
          success: function (res) {
            openId = res.data.openid;
            var session_key = res.data.session_key
            wx.setStorageSync('openId', openId);
            wx.setStorageSync('session_key', session_key);
            //openID获取成功则首次拉取用户信息 保存本地
            let userInfo = wx.getStorageSync('userInfo')
            if (!userInfo) {
              wx.getUserInfo({
                success: function (res2) {
                  var userInfo = res2.userInfo
                  userInfo.openId = openId
                  wx.setStorageSync('userInfo', res2.userInfo);
                  //用户信息获取成功 则开始首次用户注册
                  wx.request({
                    url: that.globalData.apiHost +'/hmj-users', //注册
                    method: 'POST',
                    data: userInfo,
                    dataType: 'json',
                    header: {
                      'content-type': 'application/json'
                    },
                    success: function (res) {
                     
                    }
                  })
                },
                fail: function (err) {
                  that.getUserFail();
                }
              })
            } else {
              wx.request({
                url: that.globalData.apiHost+'/hmj-users/oneuser/' + wx.getStorageSync('openId'), 
                header: {
                  'content-type': 'application/json'
                },
                success: function (res) {
                  console.log(res.data)
                },
                fail: function (err) {
                  that.getUserFail();
                }
              })
            }

          }
        })
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
              // console.log(this.globalData.userInfo)
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
    userInfo: null,
    openId: null,
    apiHost: "http://pay.atvmusic.com.cn/order/api",//电脑本地联调
  //  apiHost: "http://localhost:8081/order/api",//电脑本地联调
  },
  getUserFail: function () {
    wx.showModal({
      title: '一键注册',
      content: '欢迎使用自助点餐服务,请进入[个人中心]，完成一键注册',
      showCancel: false,
      success: function (res) {
        if (res.confirm) {
          wx.navigateTo({
            url: '../mine/mine'
          })
        }
      }
    })
  }
})