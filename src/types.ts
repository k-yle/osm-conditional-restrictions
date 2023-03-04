export type Tags = {
  [key: string]: string;
};

export type ConditionNode = {
  type: 'Condition';
  string: string;
};

export type LogicalOperatorNode = {
  type: 'LogicalOperator';
  operator: 'AND' | 'OR';
  children: Node[];
};
export type Node = LogicalOperatorNode | ConditionNode;

export type Exception = {
  value: string;
  if?: Node;
};

export type Conditional = {
  default: string | undefined;
  exceptions: Exception[];
};
