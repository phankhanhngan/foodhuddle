import axios from 'axios';
import { constantData } from 'src/constant/constant-data';

export class ShopInfo {
  async getShopInfo(shopLink: string) {
    try {
      const config = {
        headers: constantData.headers,
      };

      const getShopUrl = shopLink
        .split('https://shopeefood.vn/')[1]
        .split('?')[0];

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
          shopName: reponseDataShopInfo.reply.delivery_detail.name,
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
