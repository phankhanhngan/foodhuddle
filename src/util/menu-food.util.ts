import axios from 'axios';

export class MenuShopUtil {
  async getMenuFood(shopLink: string) {
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

      const shopId = (await axios.get(urlGetShopId, config)).data?.reply
        .delivery_id;

      const urlGetShopMenu = `https://gappapi.deliverynow.vn/api/dish/get_delivery_dishes?id_type=2&request_id=${shopId}`;

      const reponseData = (await axios.get(urlGetShopMenu, config)).data;

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
                    option_items: optionItems,
                  };
                  return option;
                })
              : [];

            const menuFood = {
              id: fbd.id,
              name: fbd.name,
              description: fbd.description,
              price: fbd.price.value,
              discount_price: fbd.discount_price ? fbd.discount_price.value : 0,
              photo: fbd.photos[0].value,
              options: optionsFood,
            };

            return menuFood;
          }
        });

        return foodByDish;
      });

      return menuFoodFormated;
    } catch (error) {
      throw error;
    }
  }
}
