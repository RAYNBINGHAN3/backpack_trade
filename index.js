"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const backpack_client = require("./backpack_client");

function delay(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}


function getNowFormatDate() {
    var date = new Date();
    var seperator1 = "-";
    var seperator2 = ":";
    var month = date.getMonth() + 1;
    var strDate = date.getDate();
    var strHour = date.getHours();
    var strMinute = date.getMinutes();
    var strSecond = date.getSeconds();
    if (month >= 1 && month <= 9) {
        month = "0" + month;
    }
    if (strDate >= 0 && strDate <= 9) {
        strDate = "0" + strDate;
    }
    if (strHour >= 0 && strHour <= 9) {
        strHour = "0" + strHour;
    }
    if (strMinute >= 0 && strMinute <= 9) {
        strMinute = "0" + strMinute;
    }
    if (strSecond >= 0 && strSecond <= 9) {
        strSecond = "0" + strSecond;
    }
    var currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate
        + " " + strHour + seperator2 + strMinute
        + seperator2 + strSecond;
    return currentdate;
}

//价格上下浮动量
const DRIFT = 0.1
// const QUANTY = '100' //每次购买量 usdc

const init = async (client) => {
    try {
        
        //取消所有未完成订单
        console.log(getNowFormatDate(), "检查未完成订单中...");
        let GetOpenOrders = await client.GetOpenOrders({ symbol: "SOL_USDC" });
        if (GetOpenOrders.length > 0) {
            let CancelOpenOrders = await client.CancelOpenOrders({ symbol: "SOL_USDC" });
            console.log(getNowFormatDate(), "取消了所有挂单");
        }

        console.log(getNowFormatDate(), "正在获取账户信息中...");
        //获取账户信息
        let userbalance = await client.Balance();
        console.log(getNowFormatDate(), "账户信息:", userbalance);
        console.log(getNowFormatDate(), "正在获取sol_usdc的市场当前价格中...");

        
        if (userbalance.SOL.available < 0.1) {
            await buy(client, userbalance);
        } else {
            await sell(client, userbalance);
            return;
        }
    } catch (e) {
        console.log(getNowFormatDate(), "挂单失败，重新挂单中...");
        console.log(e)
        await delay(3000);
    }
}



const sell = async (client, userbalance2) => {

    //获取当前
    let { lastPrice: lastPriceask } = await client.Ticker({ symbol: "SOL_USDC" });
    console.log(getNowFormatDate(), "当前市场价格:", lastPriceask);

    let quantitys = (userbalance2.SOL.available - 0.01).toFixed(2).toString();
  
    //上浮0.1挂单
    let limitPrice = (lastPriceask + DRIFT).toFixed(2).toString();
    console.log(getNowFormatDate(), "设置卖出价:", parseFloat(limitPrice));
    let orderResultAsk = await client.ExecuteOrder({
        orderType: "Limit",
        price: limitPrice,
        quantity: quantitys,
        side: "Ask", //卖
        symbol: "SOL_USDC",
        timeInForce: "GTC"
    })


    if (orderResultAsk?.status == "Filled" && orderResultAsk?.side == "Ask") {
        console.log(getNowFormatDate(), "市场价卖出成功");
   
        console.log(getNowFormatDate(), "订单详情:", `卖出价格:${orderResultAsk.price}, 卖出数量:${orderResultAsk.quantity}, 订单号:${orderResultAsk.id}`);
        // init(client);
    } else {
        console.log(getNowFormatDate(), "卖出订单等待成交........");
        // throw new Error("卖出失败");
    }
}

const buy = async (client, userbalance) => {

    //获取当前
    let { lastPrice } = await client.Ticker({ symbol: "SOL_USDC" });
    console.log(getNowFormatDate(), "当前市场价格:", lastPrice);
  
    let quantitys = ((userbalance.USDC.available - 20) / lastPrice).toFixed(2).toString();

    //下浮0.1挂单
    let limitPrice = (lastPrice - DRIFT).toFixed(2).toString();
    console.log(getNowFormatDate(), "设置买入价:", parseFloat(limitPrice));
    let orderResultBid = await client.ExecuteOrder({
        orderType: "Limit",
        price: limitPrice,
        quantity: quantitys,
        side: "Bid", //买
        symbol: "SOL_USDC",
        timeInForce: "GTC"
    })

    if (orderResultBid?.status == "Filled" && orderResultBid?.side == "Bid") {
        console.log(getNowFormatDate(), "市场价买入成功");
    
        console.log(getNowFormatDate(), "订单详情:", `购买价格:${orderResultBid.price}, 购买数量:${orderResultBid.quantity}, 订单号:${orderResultBid.id}`);
        // init(client);
    } else {
        console.log(getNowFormatDate(), "买入订单等待成交........");
        // throw new Error("买入失败");
    }
}


(async () => {
    //在这创建你的api keys https://backpack.exchange/settings/api-keys
    const apisecret = "";
    const apikey = "";
    const client = new backpack_client.BackpackClient(apisecret, apikey);

    while (true) {
        init(client)
        await delay(30000) //30s
        console.log()
        console.log('////////////////////////////////////////////////////////////////////')
    }

})()
