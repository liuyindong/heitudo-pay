// pages/order/detail/detail.js
const app = getApp()

var  SocketTask;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    cartList: [],
    sumMonney: 0,
    cutMonney: 0,
    cupNumber: 0,
    orderId:"",
    cathNumber:"",
    time:"",
    model: 0,//1是预约模式  0是到店模式
    appointTime: "",
    status:1,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.setNavigationBarTitle({
      title: '订单详情'
    })
    var openid = wx.getStorageSync('openId')
    this.webSocketInit(openid,this);
    this.getMyOrderDetail(options.orderId);

  },
  //长链接
  webSocketInit: function (openid, that) {

    // 创建Socket
    SocketTask = wx.connectSocket({
      url: 'ws://127.0.0.1:8081/order/websocket/'+openid,
      data: 'data',
      header: {
        'content-type': 'application/json'
      },
      method: 'GET',
      success: function (res) {
        console.log('WebSocket连接创建', res)
      },
      fail: function (err) {
        wx.showToast({
          title: '网络异常！',
        })
      },
    })
  },
  //获取订单详情
  getMyOrderDetail:function(id){
    var that = this;
    wx.request({
      url: app.globalData.apiHost +'/orders/'+id, //获取订单详情
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        that.setData({
          userOrder: res.data
        })
      }
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

    var that = this;

    SocketTask.onMessage(onMessage => {
     
     try {
       
      var data = JSON.parse(onMessage.data);
      if(data.sendWebSocketMsg == 'ORDER_COMPLETED'){
        that.getMyOrderDetail(data.message);
        wx.vibrateShort();
      }

     } catch (error) {
       console.log(onMessage)
     }

      
    })
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  }
})