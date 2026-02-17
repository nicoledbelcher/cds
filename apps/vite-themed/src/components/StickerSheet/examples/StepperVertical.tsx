import { useStepper } from '@coinbase/cds-common/stepper/useStepper';
import { IconButton } from '@coinbase/cds-web/buttons/IconButton';
import { ListCell } from '@coinbase/cds-web/cells/ListCell';
import { HStack } from '@coinbase/cds-web/layout/HStack';
import { VStack } from '@coinbase/cds-web/layout/VStack';
import { Stepper, type StepperValue } from '@coinbase/cds-web/stepper/Stepper';
import { useState, memo } from 'react';

const steps = [
  {
    id: 'book-flight' as const,
    label: 'Book Flight',
    metadata: {
      name: 'Delta Airlines',
      date: '2025-06-13',
      time: '1:15pm Departure',
    },
  },
  {
    id: 'book-hotel' as const,
    label: 'Book Hotel',
    metadata: {
      name: 'Marriott Downtown',
      date: '2025-06-13',
      time: '3:00pm Check-in',
    },
  },
  {
    id: 'rental-car' as const,
    label: 'Reserve Rental Car',
    metadata: {
      name: 'Enterprise',
      date: '2025-06-14',
      time: '8:00am Pickup',
    },
  },
] satisfies StepperValue<{
  name: string;
  date: string;
  time: string;
}>[];

const CustomBookingLabel = memo(({ step, active }: any) => {
  const { label, metadata } = step;

  return (
    <ListCell
      title={label}
      description={metadata.name}
      detail={metadata.date}
      subdetail={metadata.time}
      width={280}
      priority="end"
      innerSpacing={{ paddingStart: 1.5, paddingTop: 0, paddingBottom: 0 }}
      outerSpacing={{
        paddingTop: 0,
        paddingBottom: 4,
        paddingStart: 0,
        paddingEnd: 0,
      }}
      minHeight={undefined}
    />
  );
});

export const StepperVerticalCustomExample = memo(() => {
  const [stepperState, stepperApi] = useStepper({ steps });
  const [complete, setComplete] = useState(false);

  const handleNext = () => {
    if (stepperState.activeStepId === steps[steps.length - 1].id) {
      setComplete(true);
    } else {
      stepperApi.goNextStep();
    }
  };

  const handlePrevious = () => {
    setComplete(false);
    stepperApi.goPreviousStep();
  };

  const handleReset = () => {
    setComplete(false);
    stepperApi.reset();
  };

  return (
    <VStack>
      <Stepper
        direction="vertical"
        activeStepId={stepperState.activeStepId}
        steps={steps}
        complete={complete}
        StepperLabelComponent={CustomBookingLabel}
      />
      <HStack style={{ gap: 8 }} alignSelf="center">
        <IconButton active variant="primary" name="arrowLeft" compact onClick={handlePrevious} />
        <IconButton active variant="primary" name="arrowRight" compact onClick={handleNext} />
        {/* {complete && <Button onClick={handleReset}>Reset</Button>} */}
      </HStack>
    </VStack>
  );
});
