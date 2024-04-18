import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { createBooking } from "../../services/apiBookings";

function useAddBooking() {
  //imported from cabin version, needs modification
  const queryClient = useQueryClient();

  const { mutate: mutateAddBooking, isPending: isPendingAddBooking } =
    useMutation({
      mutationFn: createBooking,
      onSuccess: (data) => {
        toast.success("Booking Successfully Created!", data);
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["bookings"] });
        }, 100);
      },
      onError: (err) => {
        toast.error(err.message);
      },
    });
  return { mutateAddBooking, isPendingAddBooking };
}
export default useAddBooking;
