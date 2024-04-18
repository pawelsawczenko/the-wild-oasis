import { useForm, Controller } from "react-hook-form";
import styled from "styled-components";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { eachDayOfInterval, intervalToDuration } from "date-fns";

import Form from "../../ui/Form";
import FormRow from "../../ui/FormRow";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import { formatCurrency } from "../../utils/helpers";
import { useCabins } from "../cabins/useCabins";
import Spinner from "../../ui/Spinner";
import { useBookings } from "./useBookings";
import { useSettings } from "../settings/useSettings";
import useAddBooking from "./useAddBooking";
import FormRowDate from "../../ui/FormRowDate";

const StyledCheckbox = styled.input`
  display: flex;
  height: 2.4rem;
  width: 2.4rem;
  border: 1px solid var(--color-grey-300);
  background-color: var(--color-grey-0);
  border-radius: var(--border-radius-sm);
  box-shadow: var(--shadow-sm);
  border-radius: 5px;
  padding: 0.8rem 1.2rem;
  accent-color: var(--color-brand-600);
`;

const StyledSelect = styled.select`
  font-size: 1.4rem;
  padding: 0.8rem 1.2rem;
  border: 1px solid
    ${(props) =>
      props.$type === "white"
        ? "var(--color-grey-100)"
        : "var(--color-grey-300)"};
  border-radius: var(--border-radius-sm);
  background-color: var(--color-grey-0);
  font-weight: 500;
  box-shadow: var(--shadow-sm);
`;

const StyledP = styled.p`
  width: 43.5rem;
  font-size: 1.4rem;
  padding: 0.8rem 1.2rem;
  border: 1px solid var(--color-grey-300);
  border-radius: var(--border-radius-sm);
  background-color: var(--color-grey-200);
  font-weight: 500;
  box-shadow: var(--shadow-sm);
`;

function getEveryBookedDate(bookings) {
  //bookings format is [{startDate: '2024-03-12T00:00:00', endDate: '2024-03-19T00:00:00'},...]
  if (!bookings) return [];
  return bookings.reduce((acc, bkng) => {
    return acc.concat(
      eachDayOfInterval({
        start: `${bkng.startDate}Z`,
        end: `${bkng.endDate}Z`,
      })
    );
  }, []);
}

function getFormattedCabinOptions(cabins) {
  let options = cabins.map((cabin) => ({
    value: cabin.id,
    label: `Cabin: ${cabin.name} (max capacity: ${
      cabin.maxCapacity
    }, adjusted price: ${formatCurrency(
      cabin.regularPrice - cabin.discount
    )}  )`,
  }));
  options.splice(0, 0, {
    value: "",
    label: "--select a cabin--",
  });
  return options;
}

function CreateBookingForm({ onCloseModal }) {
  const { mutateAddBooking, isPendingAddBooking } = useAddBooking();

  const { isLoading: isLoadingCabins, cabins } = useCabins();
  const { isLoading: isLoadingBookings, bookings } = useBookings();
  const { isLoading: isLoadingSettings, settings } = useSettings();

  const {
    register,
    handleSubmit,
    resetField,
    getValues,
    formState,
    control,
    watch,
  } = useForm();
  const { errors } = formState;

  const watchValues = watch([
    "hasBreakfast",
    "numGuests",
    "startDate",
    "endDate",
    "cabinId",
  ]);
  const watchedHasBreakfast = watchValues[0];
  const watchedNumGuests = watchValues[1];
  const watchedStartDate = watchValues[2];
  const watchedEndDate = watchValues[3];
  const watchedCabinId = watchValues[4];

  if (isLoadingCabins || isLoadingBookings || isLoadingSettings)
    return <Spinner />;

  function getTotalPriceAndInfo(formValues, cabin) {
    const { hasBreakfast, numGuests, startDate, endDate, cabinId } = formValues;
    if (!numGuests || !startDate || !endDate || !cabinId) return;
    const numNights = intervalToDuration({
      start: startDate,
      end: endDate,
    }).days;
    let extrasPrice = 0;
    if (hasBreakfast)
      extrasPrice = numGuests * settings.breakfastPrice * numNights;
    const cabinPrice =
      numGuests * (cabin.regularPrice - cabin.discount) * numNights;
    return {
      totalPrice: cabinPrice + extrasPrice,
      breakdown: `cabin price (${formatCurrency(cabinPrice)}) ${
        hasBreakfast ? `+ breakfast (${formatCurrency(extrasPrice)})` : ""
      }`,
      numNights,
      extrasPrice,
      cabinPrice,
    };
  }

  const cabinOptions = getFormattedCabinOptions(cabins);
  const bookedDays = getEveryBookedDate(
    bookings.filter(
      (booking) =>
        booking.cabins.name ===
        cabins.find((cabin) => cabin.id === Number(watchedCabinId))?.name
    )
  );

  const { breakdown } =
    watchedNumGuests && watchedStartDate && watchedEndDate && watchedCabinId
      ? getTotalPriceAndInfo(
          {
            hasBreakfast: watchedHasBreakfast,
            numGuests: watchedNumGuests,
            startDate: watchedStartDate,
            endDate: watchedEndDate,
            cabinId: watchedCabinId,
          },
          cabins.find((cabin) => cabin.id === Number(watchedCabinId))
        )
      : { breakdown: "..." };

  const onSubmit = (data) => {
    //deconstruct data from forms
    const {
      country,
      fullName,
      email,
      nationalID,
      cabinId,
      startDate,
      endDate,
      hasBreakfast,
      numGuests,
      observations,
    } = data;

    const { totalPrice, numNights, cabinPrice, extrasPrice } =
      getTotalPriceAndInfo(
        { hasBreakfast, numGuests, startDate, endDate, cabinId },
        cabins.find((cabin) => cabin.id === Number(cabinId))
      );

    const bookingData = {
      guests: {
        fullName,
        email,
        nationalID,
        country,
      },
      booking: {
        extrasPrice,
        cabinPrice,
        totalPrice,
        numNights,
        status: "unconfirmed",
        cabinId,
        startDate,
        endDate,
        hasBreakfast: hasBreakfast === true,
        numGuests,
        observations,
        isPaid: false,
      },
    };

    mutateAddBooking(bookingData);
    onCloseModal();
  };

  const onError = (error) => {
    console.error(error);
  };

  const handleCancelClick = () => {
    onCloseModal?.();
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit, onError)}>
      {/* full name */}
      <FormRow label="Full Name" error={errors?.fullName?.message}>
        <Input
          disabled={isPendingAddBooking}
          type="text"
          id="fullName"
          {...register("fullName", { required: "This field is required" })}
        />
      </FormRow>

      {/* email */}
      <FormRow label="Email" error={errors?.email?.message}>
        <Input
          disabled={isPendingAddBooking}
          type="email"
          id="email"
          {...register("email", {
            required: "This field is required",
            pattern: {
              value: /\S+@\S+\.\S+/,
              message: "Please provide a valid email address",
            },
          })}
        />
      </FormRow>

      {/* select nationality */}
      <FormRow label="Nationality" error={errors?.country?.message}>
        <Input
          disabled={isPendingAddBooking}
          type="text"
          id="country"
          {...register("country", { required: "This field is required" })}
        />
      </FormRow>

      {/* national id */}
      <FormRow label="National ID" error={errors?.nationalID?.message}>
        <Input
          disabled={isPendingAddBooking}
          type="text"
          id="nationalID"
          {...register("nationalID", { required: "This field is required" })}
        />
      </FormRow>
      {/* actual booking inputs */}

      {/* select cabin (select showing relevant info for each cabin) */}
      <FormRow label="Cabin" error={errors?.cabinId?.message}>
        <StyledSelect
          disabled={isPendingAddBooking}
          id="cabinId"
          {...register("cabinId", {
            required: "This field is required",
            onChange: () => {
              resetField("startDate");
              resetField("endDate");
            },
            validate: (id) => {
              const cabin = cabins.filter((cab) => cab.id == id)[0];
              const numGuests = getValues().numGuests;

              if (!cabin || !numGuests) return; // no cabin selected yet
              return (
                cabin.maxCapacity >= numGuests ||
                "Number of guests is greater than cabin capacity"
              );
            },
          })}
        >
          {cabinOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </StyledSelect>
      </FormRow>

      {/* num guest */}
      <FormRow label="Number of Guests" error={errors?.numGuests?.message}>
        <Input
          disabled={isPendingAddBooking}
          type="number"
          id="numGuests"
          {...register("numGuests", {
            required: "This field is required",
            min: {
              value: 1,
              message: "Cannot register a booking without any guests",
            },
            validate: (numGuests) => {
              const cabinId = getValues().cabinId;
              if (!cabinId || !numGuests) return;
              const cabin = cabins.filter((cab) => cab.id == cabinId)[0];
              return (
                cabin.maxCapacity >= numGuests ||
                "Number of guests is greater than cabin capacity"
              );
            },
          })}
        />
      </FormRow>

      {/* start Date*/}
      <FormRowDate label="Start Date" error={errors?.startDate?.message}>
        <Controller
          control={control}
          name="startDate"
          rules={{
            required: "Please select a starting date",
            validate: () =>
              Boolean(getValues().cabinId) ||
              "Please first select a cabin to ensure your chosen date is available",
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <ReactDatePicker
              minDate={new Date()}
              disabled={!watchedCabinId || isPendingAddBooking}
              onChange={onChange} // send value to hook form
              onBlur={onBlur} // notify when input is touched/blur
              selected={value}
              excludeDates={bookedDays}
            />
          )}
        />
      </FormRowDate>

      {/* end date */}
      <FormRowDate label="End Date" error={errors?.endDate?.message}>
        <Controller
          style={{ display: "flex" }}
          control={control}
          name="endDate"
          rules={{
            required: "Please select an end date",
            validate: (endDate) => {
              const startDate = getValues().startDate;
              if (!getValues().cabinId)
                return "Please select a cabin first to ensure your chosen date is available";
              if (!startDate) return "Please first choose a start date";
              return (
                getValues().startDate < endDate ||
                "Your end date can't be earlier than your start date"
              );
            },
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <ReactDatePicker
              minDate={new Date()}
              disabled={!watchedCabinId || isPendingAddBooking}
              onChange={onChange} // send value to hook form
              onBlur={onBlur} // notify when input is touched/blur
              selected={value}
              excludeDates={bookedDays}
            />
          )}
        />
      </FormRowDate>

      {/* hasBreakfast:bool */}
      <FormRow label="Breakfast" error={errors?.hasBreakfast?.message}>
        <StyledCheckbox
          disabled={isPendingAddBooking}
          type="checkbox"
          id="hasBreakfast"
          {...register("hasBreakfast")}
        />
      </FormRow>

      <FormRow label="Comment" error={errors?.observations?.message}>
        <Input
          disabled={isPendingAddBooking}
          type="text"
          id="observations"
          {...register("observations")}
        />
      </FormRow>
      <FormRow label="Total Price">
        <StyledP>{breakdown}</StyledP>
      </FormRow>

      <FormRow>
        {/* type is an HTML attribute! */}
        <Button
          $variation="secondary"
          type="reset"
          disabled={isPendingAddBooking}
          onClick={handleCancelClick}
        >
          Cancel
        </Button>
        <Button disabled={isPendingAddBooking}>Add booking</Button>
      </FormRow>
    </Form>
  );
}

export default CreateBookingForm;
