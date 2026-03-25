const React = require('react');

const codegenNativeComponent = (_name: string) => {
  return (props: any) =>
    React.createElement('View', {
      ...props,
      testID: props?.testID ?? 'accelerated-checkout-buttons',
    });
};

export default codegenNativeComponent;
