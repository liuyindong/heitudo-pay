// pages/mine/mine.js
const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    nickName:"",
    avatarUrl:"",
    phone:"",
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that=this;
    wx.getUserInfo({
      success: function (res) {

        var userInfo = res.userInfo

        that.setData({
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl,
        })
      }
    })
    this.getKeyInfo()
  },
  gocut:function(){
    wx.navigateTo({
      url: '../cut/cut'
    })
  },
  bitphone:function(){
    wx.makePhoneCall({
      phoneNumber: '13332959163' 
    })
  },
  getPhoneNumber: function (e) {
    var that = this;
      wx.request({
        url: app.globalData.apiHost +'/hmj-users/openId', 
        method: 'PUT',
        data: {
          "encryptedData": e.detail.encryptedData,
          "iv": e.detail.iv,
          "session": wx.getStorageSync('session_key'),
          "openId": wx.getStorageSync('openId')
        },
        dataType: 'json',
        header: {
          'content-type': 'application/json'
        },
        success: function (res) {
          that.getKeyInfo()
        }
      })
  } ,
  getUserInfo: function (e) {
    console.log(e)
    var userInfo = e.detail.userInfo
    //用户信息获取成功 则开始首次用户注册
    userInfo.openId = wx.getStorageSync('openId');
    wx.setStorageSync('userInfo', userInfo);
    wx.request({
      url: app.globalData.apiHost +'/hmj-users', //注册
      method: 'POST',
      data: userInfo,
      dataType: 'json',
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
       
      }
    })
    this.setData({
      nickName: userInfo.nickName,
      avatarUrl: userInfo.avatarUrl,
    })
  },
  getKeyInfo:function(){
    var that =this;
    wx.request({
      url: app.globalData.apiHost +'/hmj-users/oneuser/' + wx.getStorageSync('openId'), //获取用户信息
      success: function (res) {
        that.setData({
          phone: res.data.phone,
        })
      }
    })
  }
})