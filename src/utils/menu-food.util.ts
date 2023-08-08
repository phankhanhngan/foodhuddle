import axios from 'axios';
import { constantData } from '../constant/constant-data';

export class MenuShopUtil {
  async getMenuFood(shopLink: string) {
    try {
      const config = {
        headers: constantData.headers,
      };

      const getShopUrl = shopLink
        .split('https://shopeefood.vn/')[1]
        .split('?')[0]
        .replace(/\/$/, '');

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

      const urlGetShopMenu = `https://gappapi.deliverynow.vn/api/dish/get_delivery_dishes?id_type=2&request_id=${shopId}`;

      const reponseData = (await axios.get(urlGetShopMenu, config)).data;

      if (reponseData.reply) {
        const menuFoodFormated = reponseData.reply.menu_infos.map((v) => {
          const foodByDish = v.dishes.map((fbd) => {
            const isFetchData = fbd.is_active && fbd.is_available;

            if (isFetchData) {
              const optionsFood = fbd.options
                ? fbd.options.map((op) => {
                    const optionItems = op.option_items.items
                      ? op.option_items.items.map((opi) => {
                          const optionItem = {
                            name: opi.name,
                            price: opi.price.value,
                          };

                          return optionItem;
                        })
                      : [];

                    const option = {
                      id: op.id,
                      mandatory: op.mandatory,
                      name: op.name,
                      option_items: {
                        min_select: op.option_items.min_select,
                        max_select: op.option_items.min_select,
                        items: optionItems,
                      },
                    };
                    return option;
                  })
                : [];

              const menuFood = {
                id: fbd.id,
                name: fbd.name,
                description: fbd.description,
                price: fbd.price.value,
                discount_price: fbd.discount_price
                  ? fbd.discount_price.value
                  : 0,
                photo: fbd.photos[0].value,
                options: optionsFood,
              };

              return menuFood;
            }
          });

          return foodByDish;
        });

        return {
          status: 200,
          data: menuFoodFormated,
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
