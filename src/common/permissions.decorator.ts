// Permissions Decorator
// Used to annotate endpoints with required permissions

export function Permissions(permission: string) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    // TODO: Attach permission metadata
  };
}
