import axios from 'axios';

export class ShopImage {
  async getShopImage(shopLink: string) {
    try {
      const config = {
        headers: {
          accept: 'application/json, text/plain, */*',
          'accept-language': 'en-US,en;q=0.9',
          'cache-control': 'no-cache',
          pragma: 'no-cache',
          'sec-ch-ua':
            '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'cross-site',
          'x-foody-access-token': '',
          'x-foody-api-version': '1',
          'x-foody-app-type': '1004',
          'x-foody-client-id': '',
          'x-foody-client-language': 'vi',
          'x-foody-client-type': '1',
          'x-foody-client-version': '3.0.0',
          Referer: 'https://shopeefood.vn/',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
        },
      };

      const getShopUrl = shopLink.split('https://shopeefood.vn/')[1];

      const urlGetShopId = `https://gappapi.deliverynow.vn/api/delivery/get_from_url?url=${getShopUrl}`;

      const checkConnection = (await axios.get(urlGetShopId, config)).data
        .reply;

      if (!checkConnection) {
        return {
          status: 400,
          message: `Invalid shop link !`,
        };
      }

      const shopId = checkConnection.delivery_id;

      const urlGetShopInfo = `https://gappapi.deliverynow.vn/api/delivery/get_detail?id_type=2&request_id=${shopId}`;

      const reponseDataShopInfo = (await axios.get(urlGetShopInfo, config))
        .data;

      if (reponseDataShopInfo.reply) {
        return {
          status: 200,
          photo: reponseDataShopInfo.reply.delivery_detail.photos[9],
        };
      } else {
        return {
          status: 400,
          message: `Invalid shop link !`,
        };
      }
    } catch (error) {
      throw error;
    }
  }
}
