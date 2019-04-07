// pages/order/list/list.js
const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    tabIndex: 0,
    orderList: [1],
    opList: [1],
    listData: [],
    appointlist: []
  },
  onShow:function(){
    this.getMyOrder(0)
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    
  },
 
  //获取我的订单
 getMyOrder:function(model){
   wx.showLoading();
   var that = this;
   console.log(model)
   //获取我的订单
   wx.request({
     url: app.globalData.apiHost +'/orders/user/'+model+'/' + wx.getStorageSync('openId'),
     method: 'GET',
     data: {},
     header: {
       'Accept': 'application/json'
     },
     success: function (res) {
       wx.hideLoading();
       that.setData({
         listData: res.data,
         loading: true
       })
     }
   })
 },
 
  changeTab: function (e) {
    var index = e.currentTarget.dataset.index
    this.setData({
      tabIndex: index,
    })
    this.getMyOrder(index)
  },
  golist: function () {
    wx.navigateTo({
      url: '../../list/list?model=0'
    })
  },
  goAppoint: function () {
    wx.navigateTo({
      url: '../../appoint/appoint'
    })
  },
  //进入详情
  goDetail(e) {
    var orderId = e.currentTarget.dataset.orderid
    wx.navigateTo({
      url: '../detail/detail?orderId=' + orderId
    })
  },
  call(e) {
    wx.sendSocketMessage({
      data: JSON.stringify({
        "nu": e.target.dataset.nu,
        "type": "call"
      })
    })
  }
})