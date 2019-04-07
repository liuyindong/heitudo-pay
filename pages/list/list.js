// pages/list/list.js
const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    listData: [],
    activeIndex: 0,
    toView: 'a0',
    scrollTop: 100,
    screenWidth: 667,
    showModalStatus: false,
    currentType:0,
    cartList: [],//购物车
    sumMonney: 0,//总金额
    cupNumber: 0,//总杯数
    scrollH: 1000,
    showCart: false,//是否显示购物车
    loading: false,
    cartMap: {},//购物车map
    model: 0,//1是预约模式  0是到店模式
    appointTime: "",
    scrollArr: [],
    sizeBox: [],
    sizeEx: 0,
    formatInfo:[],
    userFormatInfos:[]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if (options.model == 1) {
      this.setData({
        model: 1,
        appointTime: options.appointTime
      })
    }
    var that = this;
    this.getList()
  },
  getList() {
    var that = this;
    var sysinfo = wx.getSystemInfoSync().windowHeight;
    wx.showLoading({
    })
    let offsetS = 120
    //兼容iphoe5滚动
    if (sysinfo < 550) {
      offsetS = -40
    }
    //兼容iphoe Plus滚动
    if (sysinfo > 650 && sysinfo < 700) {
      offsetS = 240
    }
    wx.request({
      url: app.globalData.apiHost + '/menus/main',
      method: 'GET',
      data: {},
      header: {
        'Accept': 'application/json'
      },
      success: function (res) {
        let scrollArr = [0]
        //动态计算联动节点
        for (let i = 0; i < res.data.length; i++) {
          console.log(res.data[i].foods.length)
          scrollArr.push(scrollArr[i] + 73 * res.data[i].foods.length + 18)
        }
        that.setData({
          scrollArr: scrollArr,
          listData: res.data,
          loading: true,
          scrollH: sysinfo * 2 - offsetS
        })
        wx.hideLoading();
      }
    })
  },

  selectMenu: function (e) {
    var index = e.currentTarget.dataset.index
    console.log(index)
    this.setData({
      activeIndex: index,
      toView: 'a' + index,
    })
  },
  //监听滚动 完成右到左的联动
  scroll: function (e) {
    var dis = e.detail.scrollTop
    for (let i = 0; i < this.data.scrollArr.length; i++) {
      if (i < this.data.scrollArr.length - 1) {
        if (dis > this.data.scrollArr[i] && dis < this.data.scrollArr[i + 1]) {
          console.log(i)
          this.setData({
            activeIndex: i,
          })
          break;
        }
      } else {
        this.setData({
          activeIndex: this.data.scrollArr.length - 1,
        })
      }

    }
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  selectInfo: function (e) {
    var that = this;
    var type = e.currentTarget.dataset.type;
    var index = e.currentTarget.dataset.index;
    var a = this.data;
    var foods = a.listData[type].foods[index];
    a.listData[type].foods[index].format=[];
    a.listData[type].foods[index].priceOrder = a.listData[type].foods[index].price;
    if(a.listData[type].foods[index].listShowNum == undefined){
      a.listData[type].foods[index].listShowNum = 0;
    }
    
    wx.request({
      url: app.globalData.apiHost + '/foods/info/'+foods.id,
      method: 'GET',
      data: {},
      header: {
        'Accept': 'application/json'
      },
      success: function (res) {
        that.setData({
          currentType: type,
          currentIndex: index,
          listData:a.listData
        });
         //判断如何没有其他配置则直接添加购物车
         if(res.data.length <= 0){
          that.addToCart();
          return;
        }

        for (let i = 0; i < res.data.length; i++) {
          for(let j = 0; j < res.data[i].formatInfos.length; j++){
            res.data[i].formatInfos[j].select = false;
            if(j==0){
              const foodsInfo = res.data[i].formatInfos[j];
              foodsInfo.select = true;
              //默认选中需要做一些
              a.listData[type].foods[index].format.push(foodsInfo)
            }
          }
        }
        that.setData({
          showModalStatus: !that.data.showModalStatus,
          formatInfo:res.data,
          listData:a.listData
        });
      }
    })
  },

  lessInfo:function(e){

    var type = e.currentTarget.dataset.type;
    var index = e.currentTarget.dataset.index;
    var cartList = this.data.cartList;
    var listData = this.data.listData;
    var foods = listData[type].foods[index];
    var that = this;

    foods.listShowNum -=1;
  
    for(let i = 0; i<cartList.length; i++){
      if(cartList[i].id == foods.id){
        that.lessCarNum(i);
      }
    }

  },

  closeModal: function () {
    this.setData({
      showModalStatus: false
    });
  },
  chooseSE: function (e) {
    var local = this;
    var a = local.data.listData;
    var info = e.currentTarget.dataset.info;

    var type = e.currentTarget.dataset.type;
    var index = e.currentTarget.dataset.index;
    
    //切换菜单


    var item = a[this.data.currentType].foods[this.data.currentIndex]
    for(let j = 0; j < local.data.formatInfo[type].formatInfos.length; j++){
      local.data.formatInfo[type].formatInfos[j].select = false
    }
    local.data.formatInfo[type].formatInfos[index].select = true
    if(item.format == undefined){
      item.format = []
    }
    for (let i = 0; i < item.format.length; i++){
      if (info.formatId == item.format[i].formatId) {
        item.format.splice(i, 1)
      }
    };
    item.format.push(info);
    
    //计算价格
    item.priceOrder = item.price;
    for (let i = 0; i < item.format.length; i++){
      item.priceOrder += item.format[i].price
    };
    this.setData({
      listData: a,
      formatInfo:this.data.formatInfo
    })
  },
  //加入购物车
  addToCart: function () {
    var a = this.data
    var listData = a.listData;
    var cartList = a.cartList;
    const foods =  listData[a.currentType].foods[a.currentIndex];
    listData[a.currentType].foods[a.currentIndex].listShowNum +=1;
    if(foods.number == undefined){
      listData[a.currentType].foods[a.currentIndex].number=1;
      if(foods.priceOrder == undefined){
        listData[a.currentType].foods[a.currentIndex].priceOrder=foods.price;
      }
    }else{
      if(foods.format == undefined || foods.format.length <= 0){
        listData[a.currentType].foods[a.currentIndex].number+=1;
      } 
    }
    if(foods.format == undefined || foods.format.length <= 0){
      for (let i = 0; i < cartList.length; i++) {
        if (cartList[i].id == foods.id) {
          cartList.splice(i, 1)
        }
      }
    }
    cartList.push(foods);
    var sumMonney = a.sumMonney + foods.priceOrder
    this.setData({
      cartList: cartList,
      showModalStatus: false,
      cupNumber: a.cupNumber + 1,
      listData: listData,
      sumMonney:sumMonney
    });

    console.log(cartList)

  },
  showCartList: function () {
    if (this.data.cartList.length != 0) {
      this.setData({
        showCart: !this.data.showCart,
      });
    }

  },
  clearCartList: function () {
    var a = this.data
    
    var cartList = a.cartList;
    for(let i =0; i<cartList.length; i++){
      //找到清空数量价格
      for(let j = 0; j < a.listData.length; j++){
        for(let g = 0; g <  a.listData[j].foods.length; g++){
          if(a.listData[j].foods[g].id == cartList[i].id){
            a.listData[j].foods[g].priceOrder = a.listData[j].foods[g].price;
            a.listData[j].foods[g].number = 0;
            a.listData[j].foods[g].listShowNum = 0;
          }
        }
      }
    }

    this.setData({
      cartList: [],
      showCart: false,
      sumMonney: 0,
      cupNumber: 0,
      listData:a.listData
    });
  },
  addNumber: function (e) {
    this.addCarNum(e.currentTarget.dataset.index);
  },
  decNumber: function (e) {
    this.lessCarNum(e.currentTarget.dataset.index);
  },

  addCarNum:function(index){

    var a = this.data
    var cartList = a.cartList; 
    var listData = a.listData;
    const foods = a.listData[a.currentType].foods[a.currentIndex];

    foods.listShowNum +=1;
    foods.number+=1

    var sum = a.sumMonney + cartList[index].priceOrder;
    cartList[index].number+=1;
    this.setData({
      listData: listData,
      cartList: cartList,
      sumMonney: sum,
      cupNumber: a.cupNumber + 1
    });

  },

  lessCarNum:function(index){

    var cartList = this.data.cartList;
    var listData = this.data.listData
    var sum = this.data.sumMonney - cartList[index].priceOrder;
    var a = this.data
    const foods = listData[a.currentType].foods[a.currentIndex];
    foods.listShowNum -=1;
    foods.number-=1


    cartList[index].number == 1 ? cartList.splice(index, 1) : cartList[index].number--;
    this.setData({
      listData: listData,
      cartList: cartList,
      sumMonney: sum,
      showCart: cartList.length <= 0 ? false : a.showCart,
      cupNumber: this.data.cupNumber - 1
    });

  },

  goBalance: function () {
    if (this.data.sumMonney != 0) {
      wx.setStorageSync('cartList', this.data.cartList);
      wx.setStorageSync('sumMonney', this.data.sumMonney);
      wx.setStorageSync('cupNumber', this.data.cupNumber);
      wx.navigateTo({
        url: '../order/balance/balance?model=' + this.data.model + "&appointTime=" + this.data.appointTime
      })
    }
  },
  //提示
  notice: function () {
    
    var that = this;
    wx.showModal({
      title: '提示',
      content: '因含有规格，请在购物车内删减',
      showCancel: false,
      success: function (res) {
        if (res.confirm) {
          that.setData({
            showCart: true
          });
        }
      }
    })
  },
  onReady: function () {

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