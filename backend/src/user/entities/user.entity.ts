import { Auth } from 'src/auth/entities/auth.entity';
import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  refresh_token?: string | null;

  @OneToMany(() => Auth, (auth) => auth.user)
  auths!: Auth[];
}
