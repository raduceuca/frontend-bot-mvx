import { WidgetType } from 'types/widget.types';

export const Widget = ({
  widget: MxWidget,
  props = {}
}: WidgetType) => {
  return <MxWidget {...props} />;
};
