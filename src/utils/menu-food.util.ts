import { BadRequestException, Injectable } from '@nestjs/common';
import axios from 'axios';
import { constantData } from 'src/constant/constant-data';
import {
  FoodDTO,
  OptionDTO,
  OptionListDTO,
} from 'src/modules/food_orders/dtos';

@Injectable()
export class MenuShopUtil {
  async getMenuFood(shopLink: string) {
    try {
      const config = {
        headers: constantData.headers,
      };

      const getShopUrl = shopLink.split('https://shopeefood.vn/')[1];

      const urlGetShopId = `https://gappapi.deliverynow.vn/api/delivery/get_from_url?url=${getShopUrl}`;

      const checkConnection = (await axios.get(urlGetShopId, config)).data
        .reply;

      if (checkConnection) {
        const shopId = (await axios.get(urlGetShopId, config)).data?.reply
          .delivery_id;

        const urlGetShopMenu = `https://gappapi.deliverynow.vn/api/dish/get_delivery_dishes?id_type=2&request_id=${shopId}`;

        const reponseData = (await axios.get(urlGetShopMenu, config)).data;

        if (reponseData.reply) {
          const menuFoodFormated = reponseData.reply.menu_infos.map((v) => {
            const foodByDish = v.dishes.map((fbd) => {
              const isFetchData = fbd.is_active && fbd.is_available;

              if (isFetchData) {
                const optionsFood: OptionListDTO[] = fbd.options
                  ? fbd.options.map((op) => {
                      const optionItems: OptionDTO[] = Array.from<OptionDTO>(
                        op.option_items.items
                          ? op.option_items.items.map((opi) => {
                              const optionItem = {
                                name: opi.name,
                                price: opi.price.value,
                              };

                              return optionItem;
                            })
                          : [],
                      );

                      const option: OptionListDTO = {
                        id: op.id,
                        mandatory: op.mandatory,
                        category: op.name,
                        minSelection: op.option_items.min_select,
                        maxSelection: op.option_items.max_select,
                        detail: optionItems,
                      };
                      return option;
                    })
                  : [];

                const menuFood: FoodDTO = {
                  id: fbd.id,
                  foodName: fbd.name,
                  description: fbd.description,
                  price: fbd.price.value,
                  discountPrice: fbd.discount_price
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

          return menuFoodFormated
            .flat(Infinity)
            .filter((food: FoodDTO | undefined) => food);
        }
      }

      throw new BadRequestException('Invalid shop link');
    } catch (error) {
      throw error;
    }
  }
}
