/* eslint-disable */
import { BLOCK_ID_FIELDS, ID_DELIVERY_TERM_TYPE } from "../../api.constants";
import { FormGroup } from "@angular/forms";
import { CommonService } from "../services/common-service.service";

//todo добавить типы
export function createEndObjectForRule(
  goodsList,
  termsPaymentForm: FormGroup,
  momentPrepayment,
  isNotSpecified: boolean | null,
  deliveryBasis,
  deliveryTermForm: FormGroup,
  schedule,
  isDisabledButtonSchedule: boolean,
  commonService: CommonService
): object {
  let objForReq = {}; //объект для записи в боди
  goodsList.forEach((item) => {
    let endKeys = [];
    let endValues = [];
    let objectForValues = {}; //объект заполненных полей 1 товара

    item.fields.forEach((block) => {
      for (let i = 0; i < block[1].length; i++) {
        if (block[1][i].interfaceField.fieldId) {
          endKeys.push(
            'field' +
            (Number(block[1][i].interfaceField.blockId) === 0
              ? BLOCK_ID_FIELDS.ADDITIONAL_BLOCK
              : block[1][i].interfaceField.blockId)
            +
            'n' +
            block[1][i].interfaceField.fieldId
          );
          endValues.push(block[1][i].selectedValues);
        }
      }
      objectForValues = Object.assign(
        {},
        ...endKeys.map((n, i) => ({ [n]: endValues[i] }))
      );
    });

    objectForValues['products'] = null;

    if (goodsList[0] == item) {
      objectForValues['termsConditionsPayment'] = {
        paymentConditionId:
        termsPaymentForm.controls['termsPayment']?.value,
        paymentVolumeId: termsPaymentForm.controls['volume']?.value,
        prepayMomentId:
          termsPaymentForm.controls['momentPrepayment']?.value || null,
        delayMomentId:
          termsPaymentForm.controls['momentDelay']?.value || null,
        dayTypeId: termsPaymentForm.controls['dayTypeId']?.value || null,
        delayValue:
          termsPaymentForm.controls['defermentAmount']?.value || 0,
        delayValue2:
          termsPaymentForm.controls['defermentAmount2']?.value || null,
        prepayValue:
          termsPaymentForm.controls['prepaymentAmount']?.value || 0,
        delayTerm: {
          applicableDayCount: momentPrepayment?.options
            .applicableDayCount
            ? termsPaymentForm.controls['defermentPeriodNumber']?.value
            : null,
          calendarDayCount2:
            termsPaymentForm.controls['defermentPeriod2']?.value || null,
          dayOfMonth: momentPrepayment?.options.dayOfMonth
            ? termsPaymentForm.controls['defermentPeriodNumber']?.value
            : null,
          date: momentPrepayment?.options.date
            ? termsPaymentForm.controls['defermentPeriodDate']?.value
            : null,
        },
        prepayTerm: {
          applicableDayCount: momentPrepayment?.options.calendarDayCount
            ? termsPaymentForm.controls['prepaymentPeriodNumber']?.value
            : null,
          dayOfMonth: momentPrepayment?.options.dayOfMonth
            ? termsPaymentForm.controls['prepaymentPeriodNumber']?.value
            : null,
          date: momentPrepayment?.options.date
            ? termsPaymentForm.controls['prepaymentPeriodDate']?.value
            : null,
        },
      };

      if (!isNotSpecified) {
        let extra = [];
        let main = {};
        deliveryBasis?.forEach((item) => {
          if (item.coreBasis) {
            main = {
              minAddBasisPlaces: item.minAddBasisPlaces,
              contradictoryValueId: item.contradictoryValueId,
              contradictoryBasisName: item.contradictoryBasisName,
              isRequiredPlace: item.isRequiredPlace,
              isRequiredAddBasis: item.isRequiredAddBasis,
              minAddBasis: item.minAddBasis,
              placeName: item.enterPlaceName,
              placeTypeId: item.placeTypeId,
              parentId: item.parentId,
              linkId: item.idBasisLink,
              valueId: item.idBasisValue,
              level: item.level,
              hasChildren: item.hasChildren,
              basisId: item.basisId,
              basisName: item.basisName,
            };
          } else {
            extra.push({
              minAddBasisPlaces: item.minAddBasisPlaces,
              contradictoryValueId: item.contradictoryValueId,
              contradictoryBasisName: item.contradictoryBasisName,
              isRequiredPlace: item.isRequiredPlace,
              isRequiredAddBasis: item.isRequiredAddBasis,
              minAddBasis: item.minAddBasis,
              placeName: item.enterPlaceName,
              placeTypeId: item.placeTypeId,
              parentId: item.parentId,
              linkId: item.idBasisLink,
              valueId: item.idBasisValue,
              level: item.level,
              hasChildren: item.hasChildren,
              basisId: item.basisId,
              basisName: item.basisName,
            });
          }
        });
        objectForValues['deliveryCondition'] = Object.assign(
          { main: main },
          { extra: extra }
        );
      }

      objectForValues['deliveryTerm'] = {
        deliveryStartId: deliveryTermForm.value.startDelivery,
        deliveryTermId: deliveryTermForm.value.deliveryType,
        dayValue:
          Number(deliveryTermForm.value.deliveryType) === ID_DELIVERY_TERM_TYPE.CALENDAR_DAYS
            ? deliveryTermForm.value.deliveryTerm
            : null,
        monthValue:
          Number(deliveryTermForm.value.deliveryType) === ID_DELIVERY_TERM_TYPE.MONTHS
            ? deliveryTermForm.value.deliveryTerm
            : null,
        startDeliveryDate: deliveryTermForm.value?.startDate
          ? commonService.toOADate(
            deliveryTermForm.value?.startDate
          )
          : null,
        endDeliveryDate: deliveryTermForm.value?.endDate
          ? commonService.toOADate(deliveryTermForm.value?.endDate)
          : null,
      };

      if (schedule.length > 0 && !isDisabledButtonSchedule) {
        let periods = [];

        schedule.forEach((item) => {
          for (let i = 0; i < item.goods.length; i++) {
            periods.push({
              number: item.numberPeriod,
              startDate: item.startDate,
              endDate: item.endDate,
              volume: item.goods[i].volume,
              unit: item.goods[i].units.name,
            });
          }
        });

        objectForValues['deliverySchedule'] = Object.assign(
          {
            periodType: {
              id: schedule[0]?.idPeriod,
              name: '',
            },
          },
          { periods: periods }
        );
      }
    }

    let endObject = {}; //объект с индексом товара

    endObject[goodsList.indexOf(item)] = objectForValues;
    objForReq = Object.assign(endObject, objForReq);
  });

  return objForReq;
}
